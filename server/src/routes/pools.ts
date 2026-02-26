import { Router } from 'express';
import type { IPoolService } from '../services/types.js';

export function poolRoutes(service: IPoolService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await service.getAll();
    res.json({ data, timestamp: new Date().toISOString() });
  });

  router.get('/:id', async (req, res) => {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found', message: 'Pool not found', statusCode: 404 });
    res.json({ data: item, timestamp: new Date().toISOString() });
  });

  return router;
}
