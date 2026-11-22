import { Request, Response } from 'express';
import { DriverService } from './driver.service.js';

const service = new DriverService();

async function findAll(_req: Request, res: Response) {
  res.json({ data: await service.findAll() });
}

async function findAllInactive(_req: Request, res: Response) {
  res.json({ data: await service.findAllInactive() });
}

async function findOne(req: Request, res: Response) {
  res.json(await service.findOne(req.params.id));
}

async function add(req: Request, res: Response) {
  res.status(201).json(await service.add(req.body.sanitizeInput));
}

async function update(req: Request, res: Response) {
  res.status(200).json(
    await service.update(req.params.id, req.body.sanitizeInput)
  );
}

async function remove(req: Request, res: Response) {
  res.json(await service.remove(req.params.id));
}

async function reactivate(req: Request, res: Response) {
  res.json(await service.reactivate(req.params.id));
}

export { findAll, findAllInactive, findOne, add, update, remove, reactivate };
