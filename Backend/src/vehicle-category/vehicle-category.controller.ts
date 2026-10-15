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

async function updateFuelConsumption(req: Request, res: Response) {
  const id = Number(req.params.id);
  const litrosPorKm = Number(req.body.litrosPorKm);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'El identificador de categoria no es valido' });
    return;
  }
  if (!Number.isFinite(litrosPorKm) || litrosPorKm <= 0) {
    res.status(400).json({ error: 'El consumo debe ser un numero mayor a 0 litros por kilometro' });
    return;
  }
  res.json(await repository.updateFuelConsumption(id, litrosPorKm));
}

async function updateSettings(req: Request, res: Response) {
  const id = Number(req.params.id);
  const precioBase = Number(req.body.precioBase);
  const litrosPorKm = Number(req.body.litrosPorKm);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'El identificador de categoria no es valido' });
    return;
  }
  if (!Number.isFinite(precioBase) || precioBase < 0) {
    res.status(400).json({ error: 'El precio base debe ser un numero mayor o igual a 0' });
    return;
  }
  if (!Number.isFinite(litrosPorKm) || litrosPorKm <= 0) {
    res.status(400).json({ error: 'El consumo debe ser un numero mayor a 0 litros por kilometro' });
    return;
  }
  res.json(await repository.updateSettings(id, precioBase, litrosPorKm));
}

export { findAll, updatePrice, updateFuelConsumption, updateSettings };