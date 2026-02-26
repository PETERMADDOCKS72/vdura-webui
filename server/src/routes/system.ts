import { Router } from 'express';
import type { ISystemService } from '../services/types.js';

export function systemRoutes(service: ISystemService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await service.getInfo();
    res.json({ data, timestamp: new Date().toISOString() });
  });

  return router;
}
