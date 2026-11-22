import { Request, Response } from 'express';
import { BookingService } from './booking.service.js';

const service = new BookingService();

async function findAll(req: Request, res: Response) {
  res.json(
    await service.findAll(req.query, req.user)
  );
}

async function findOne(req: Request, res: Response) {
  res.json(await service.findOne(req.params.id));
}

async function add(req: Request, res: Response) {
  res.status(201).json(
    await service.add(req.body.sanitizeInput, req.user)
  );
}

async function update(req: Request, res: Response) {
  res.status(200).json(
    await service.update(
      req.params.id,
      req.body.sanitizeInput,
      req.user
    )
  );
}

async function cancel(req: Request, res: Response) {
  res.json(await service.cancel(req.params.id, req.user));
}

async function seatsByTrips(req: Request, res: Response) {
  res.json(await service.seatsByTrips(req.query.tripIds));
}

export { findAll, findOne, add, update, cancel, seatsByTrips };
