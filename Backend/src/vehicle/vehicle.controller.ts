import { Request, Response } from 'express';
import { VehicleService } from './vehicle.service.js';

const service = new VehicleService();

async function findAll(_req: Request, res: Response) {
  res.json({ data: await service.findAll() });
}

async function findOne(req: Request, res: Response) {
  res.json(await service.findOne(req.params.id));
}

async function add(req: Request, res: Response) {
  const vehicle = await service.add(req.body.sanitizeInput);
  res.status(201).json(vehicle);
}

async function update(req: Request, res: Response) {
  const vehicle = await service.update(
    req.params.id,
    req.body.sanitizeInput
  );
  res.status(200).json(vehicle);
}

async function remove(req: Request, res: Response) {
  res.json(await service.remove(req.params.id));
}

export { findAll, findOne, add, update, remove };
