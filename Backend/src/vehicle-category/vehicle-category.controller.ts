import { Request, Response } from 'express';
import { VehicleCategoryRepository } from './vehicle-category.repository.js';

const repository = new VehicleCategoryRepository();

async function findAll(req: Request, res: Response) { res.json({ data: await repository.findAll() }); }
async function updatePrice(req: Request, res: Response) {
  const price = Number(req.body.precioBase);
  if (!Number.isFinite(price) || price < 0) { res.status(400).json({ error: 'El precio base debe ser un numero mayor o igual a 0' }); return; }
  try { res.json(await repository.updatePrice(Number(req.params.id), price)); }
  catch { res.status(404).json({ error: 'Categoria no encontrada' }); }
}

export { findAll, updatePrice };