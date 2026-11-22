import { Request, Response } from 'express';
import { ProvinceService } from './province.service.js';

const service = new ProvinceService();

async function findAll(_req: Request, res: Response) {
  res.json({ data: await service.findAll() });
}

async function findOne(req: Request, res: Response) {
  res.json(await service.findOne(req.params.id));
}

async function add(req: Request, res: Response) {
  const province = await service.add(req.body.sanitizeInput.name);
  res.status(201).json(province);
}

async function update(req: Request, res: Response) {
  const province = await service.update(
    req.params.id,
    req.body.sanitizeInput.name
  );
  res.status(200).json(province);
}

async function remove(req: Request, res: Response) {
  res.json(await service.remove(req.params.id));
}

export { findAll, findOne, add, update, remove };
