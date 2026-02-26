import { Router } from 'express';
import type { IPerformanceService } from '../services/types.js';

export function performanceRoutes(service: IPerformanceService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await service.getSummary();
    res.json({ data, timestamp: new Date().toISOString() });
  });

  return router;
}
