import { Request, Response } from 'express';
import { TripService } from './trip.service.js';

const service = new TripService();

async function findAll(req: Request, res: Response) {
  res.json(await service.findAll(req.query));
}

async function findAllInactive(_req: Request, res: Response) {
  res.json(await service.findAllInactive());
}

async function findOne(req: Request, res: Response) {
  res.json(await service.findOne(req.params.id));
}

async function findPromoted(_req: Request, res: Response) {
  res.json(await service.findPromoted());
}

async function search(req: Request, res: Response) {
  res.json(await service.search(req.query));
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

export {
  findAll,
  findAllInactive,
  findOne,
  findPromoted,
  update,
  add,
  remove,
  reactivate,
  search,
};
