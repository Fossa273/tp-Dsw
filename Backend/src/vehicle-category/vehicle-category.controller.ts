import { Request, Response } from 'express';
import { VehicleCategoryService } from './vehicle-category.service.js';

const service = new VehicleCategoryService();

async function findAll(_req: Request, res: Response) {
  res.json({ data: await service.findAll() });
}

async function updatePrice(req: Request, res: Response) {
  res.json(
    await service.updatePrice(req.params.id, req.body.precioBase)
  );
}

async function updateFuelConsumption(req: Request, res: Response) {
  res.json(
    await service.updateFuelConsumption(
      req.params.id,
      req.body.litrosPorKm
    )
  );
}

async function updateSettings(req: Request, res: Response) {
  res.json(
    await service.updateSettings(
      req.params.id,
      req.body.precioBase,
      req.body.litrosPorKm
    )
  );
}

export { findAll, updatePrice, updateFuelConsumption, updateSettings };
