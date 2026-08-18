import { Request, Response } from 'express';
import { vehiculoRepository } from './vehiculo.repository.js';
import { Vehiculo } from './vehiculo.entity.js';

const repository = new vehiculoRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const vehiculo = await repository.findOne({ id });
  if (vehiculo) {
    res.json(vehiculo);
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { id, capacidadmax } = req.body.sanitizeInput;
  const nuevoVehiculo = new Vehiculo(id, capacidadmax);
  const nuevo = await repository.add(nuevoVehiculo);
  res.status(201).json(nuevo);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const vehiculoActualizado = await repository.update(req.body.sanitizeInput);
  if (vehiculoActualizado) {
    res.status(200).json(vehiculoActualizado);
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedVehiculo = await repository.delete({ id });
  if (deletedVehiculo) {
    res.json({ message: 'Vehiculo eliminado' });
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

export { findAll, findOne, add, update, remove };
