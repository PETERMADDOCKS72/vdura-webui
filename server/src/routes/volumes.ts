import { Router } from 'express';
import type { IVolumeService } from '../services/types.js';

export function volumeRoutes(service: IVolumeService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await service.getAll();
    res.json({ data, timestamp: new Date().toISOString() });
  });

  router.get('/:id', async (req, res) => {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found', message: 'Volume not found', statusCode: 404 });
    res.json({ data: item, timestamp: new Date().toISOString() });
  });

  router.post('/', async (req, res) => {
    const volume = await service.create(req.body);
    res.status(201).json({ data: volume, timestamp: new Date().toISOString() });
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await service.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found', message: 'Volume not found', statusCode: 404 });
    res.status(204).send();
  });

  return router;
}
