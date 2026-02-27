import { Client, type ClientChannel } from 'ssh2';
import type { V5000Config } from './config.js';

// Match both the Linux shell prompt (hash) and PanCLI prompt [pancli]
const SHELL_PROMPT_RE = /[#$]\s*$/m;
const PANCLI_PROMPT_RE = /\[pancli\]\s*$/m;
const MAX_RECONNECT_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;

interface QueuedCommand {
  command: string;
  resolve: (result: CommandResult) => void;
  reject: (err: Error) => void;
}

export interface CommandResult {
  output: string;
  durationMs: number;
}

export class SshClient {
  private client: Client | null = null;
  private shell: ClientChannel | null = null;
  private connected = false;
  private connecting = false;
  private destroyed = false;
  private queue: QueuedCommand[] = [];
  private processing = false;
  private config: V5000Config;

  constructor(config: V5000Config) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    this.connecting = true;

    try {
      await this.doConnect();
    } finally {
      this.connecting = false;
    }
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new Client();
      const timeout = setTimeout(() => {
        client.end();
        reject(new Error(`SSH connection timed out after ${this.config.connectTimeoutMs}ms`));
      }, this.config.connectTimeoutMs);

      client.on('ready', () => {
        clearTimeout(timeout);
        client.shell({ term: 'dumb' }, (err, stream) => {
          if (err) {
            client.end();
            return reject(err);
          }

          this.client = client;
          this.shell = stream;
          this.connected = true;

          stream.on('close', () => {
            this.connected = false;
            this.shell = null;
          });

          // Two-stage init: wait for shell prompt, then launch pancli
          this.waitForPrompt(stream, SHELL_PROMPT_RE, this.config.commandTimeoutMs)
            .then(() => {
              console.log(`[v5000] SSH shell ready on ${this.config.host}`);
              // Launch pancli
              stream.write('pancli\n');
              return this.waitForPrompt(stream, PANCLI_PROMPT_RE, this.config.commandTimeoutMs);
            })
            .then((banner) => {
              console.log(`[v5000] PanCLI ready on ${this.config.host}`);
              // Log the banner (contains system name and status)
              const clean = banner.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g, '');
              for (const line of clean.split('\n')) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('[pancli]') && !trimmed.startsWith('pancli')) {
                  console.log(`[v5000]   ${trimmed}`);
                }
              }
              resolve();
            })
            .catch((e) => {
              client.end();
              reject(e);
            });
        });
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        this.connected = false;
        if (this.connecting) {
          reject(err);
        }
      });

      client.on('close', () => {
        this.connected = false;
        this.shell = null;
      });

      // Support keyboard-interactive auth (common on V5000/PanCLI)
      client.on('keyboard-interactive', (_name, _instructions, _instructionsLang, prompts, finish) => {
        const responses = prompts.map(() => this.config.password);
        finish(responses);
      });

      client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.user,
        password: this.config.password,
        tryKeyboard: true,
        readyTimeout: this.config.connectTimeoutMs,
        algorithms: {
          kex: [
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes256-cbc',
            'aes128-cbc',
          ],
          serverHostKey: [
            'ssh-rsa',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'rsa-sha2-512',
            'rsa-sha2-256',
            'ssh-ed25519',
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
          ],
        },
      });
    });
  }

  private waitForPrompt(stream: ClientChannel, promptRe: RegExp, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let buffer = '';
      const timeout = setTimeout(() => {
        stream.removeAllListeners('data');
        reject(new Error(`Timed out waiting for prompt (${promptRe}) after ${timeoutMs}ms. Buffer: ${JSON.stringify(buffer.slice(-200))}`));
      }, timeoutMs);

      const onData = (data: Buffer) => {
        buffer += data.toString('utf8');
        if (promptRe.test(buffer)) {
          clearTimeout(timeout);
          stream.removeListener('data', onData);
          resolve(buffer);
        }
      };

      stream.on('data', onData);
    });
  }

  async execute(command: string): Promise<CommandResult> {
    if (this.destroyed) throw new Error('SshClient has been destroyed');
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      this.processQueue();
    });
  }

  async executeWithConfirmation(command: string): Promise<CommandResult> {
    if (this.destroyed) throw new Error('SshClient has been destroyed');
    return new Promise((resolve, reject) => {
      this.queue.push({
        command: `__confirm__${command}`,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await this.executeOne(item.command);
        item.resolve(result);
      } catch (err) {
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }

    this.processing = false;
  }

  private async executeOne(rawCommand: string): Promise<CommandResult> {
    const isConfirm = rawCommand.startsWith('__confirm__');
    const command = isConfirm ? rawCommand.slice('__confirm__'.length) : rawCommand;

    await this.ensureConnected();
    const shell = this.shell!;
    const start = Date.now();

    // Write the command
    shell.write(command + '\n');

    // Wait for PanCLI prompt (command output + prompt)
    let output: string;
    try {
      output = await this.waitForPrompt(shell, PANCLI_PROMPT_RE, this.config.commandTimeoutMs);
    } catch (err) {
      // On timeout, try to reconnect for next command
      this.connected = false;
      throw err;
    }

    // If confirmation needed, send 'y' and wait for next prompt
    if (isConfirm) {
      shell.write('y\n');
      try {
        const confirmOutput = await this.waitForPrompt(shell, PANCLI_PROMPT_RE, this.config.commandTimeoutMs);
        output += confirmOutput;
      } catch (err) {
        this.connected = false;
        throw err;
      }
    }

    const durationMs = Date.now() - start;

    // Clean the output: remove echoed command, prompt, and ANSI codes
    const cleaned = this.cleanOutput(output, command);

    return { output: cleaned, durationMs };
  }

  private cleanOutput(raw: string, command: string): string {
    let output = raw;

    // Remove ANSI escape codes
    output = output.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
    output = output.replace(/\r/g, '');

    // Split into lines
    const lines = output.split('\n');

    // Remove echoed command (first line that matches the command)
    const cmdIdx = lines.findIndex((l) => l.trim() === command.trim());
    const startIdx = cmdIdx >= 0 ? cmdIdx + 1 : 0;

    // Remove trailing prompt line
    let endIdx = lines.length;
    for (let i = lines.length - 1; i >= startIdx; i--) {
      if (PANCLI_PROMPT_RE.test(lines[i])) {
        endIdx = i;
        break;
      }
    }

    return lines
      .slice(startIdx, endIdx)
      .join('\n')
      .trim();
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected && this.shell) return;

    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
      try {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        if (attempt > 0) {
          console.log(`[v5000] Reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
          await this.sleep(delay);
        }
        // Clean up old client
        if (this.client) {
          try { this.client.end(); } catch { /* ignore */ }
          this.client = null;
          this.shell = null;
        }
        await this.doConnect();
        return;
      } catch (err) {
        console.error(`[v5000] Reconnect attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
      }
    }

    throw new Error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.destroyed = true;
    // Reject any queued commands
    for (const item of this.queue) {
      item.reject(new Error('SshClient destroyed'));
    }
    this.queue = [];
    if (this.client) {
      try { this.client.end(); } catch { /* ignore */ }
      this.client = null;
    }
    this.shell = null;
    this.connected = false;
  }
}
