import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServices } from './services/index.js';
import { volumeRoutes } from './routes/volumes.js';
import { poolRoutes } from './routes/pools.js';
import { hostRoutes } from './routes/hosts.js';
import { alertRoutes } from './routes/alerts.js';
import { performanceRoutes } from './routes/performance.js';
import { systemRoutes } from './routes/system.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Create services based on API_MODE
const services = createServices();

// API routes
app.use('/api/v1/volumes', volumeRoutes(services.volumes));
app.use('/api/v1/pools', poolRoutes(services.pools));
app.use('/api/v1/hosts', hostRoutes(services.hosts));
app.use('/api/v1/alerts', alertRoutes(services.alerts));
app.use('/api/v1/performance', performanceRoutes(services.performance));
app.use('/api/v1/system', systemRoutes(services.system));

// Serve static React build in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`VDURA V5000 server running on port ${port} (API_MODE=${process.env.API_MODE ?? 'mock'})`);
});
