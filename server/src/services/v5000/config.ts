export interface V5000Config {
  host: string;
  port: number;
  user: string;
  password: string;
  connectTimeoutMs: number;
  commandTimeoutMs: number;
  perfPollMs: number;
  cacheTtl: {
    performance: number;
    volumes: number;
    pools: number;
    system: number;
    alerts: number;
  };
}

export function loadV5000Config(): V5000Config {
  const host = process.env.V5000_HOST;
  const user = process.env.V5000_USER;
  const password = process.env.V5000_PASSWORD;

  if (!host) throw new Error('V5000_HOST is required');
  if (!user) throw new Error('V5000_USER is required');
  if (password === undefined) throw new Error('V5000_PASSWORD is required');

  return {
    host,
    port: parseInt(process.env.V5000_PORT ?? '22', 10),
    user,
    password,
    connectTimeoutMs: parseInt(process.env.V5000_CONNECT_TIMEOUT_MS ?? '10000', 10),
    commandTimeoutMs: parseInt(process.env.V5000_COMMAND_TIMEOUT_MS ?? '30000', 10),
    perfPollMs: parseInt(process.env.V5000_PERF_POLL_MS ?? '300000', 10),
    cacheTtl: {
      performance: 30_000,
      volumes: 120_000,
      pools: 120_000,
      system: 300_000,
      alerts: 60_000,
    },
  };
}
