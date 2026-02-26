import { Router } from 'express';
import type { IAlertService } from '../services/types.js';

export function alertRoutes(service: IAlertService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const filters = {
      severity: req.query.severity as string | undefined,
      status: req.query.status as string | undefined,
    };
    const data = await service.getAll(filters);
    res.json({ data, timestamp: new Date().toISOString() });
  });

  router.post('/:id/acknowledge', async (req, res) => {
    const alert = await service.acknowledge(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Not found', message: 'Alert not found', statusCode: 404 });
    res.json({ data: alert, timestamp: new Date().toISOString() });
  });

  return router;
}
