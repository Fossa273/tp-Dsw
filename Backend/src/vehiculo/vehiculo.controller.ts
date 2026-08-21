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
  const { capacidadmax } = req.body.sanitizeInput;
  if (capacidadmax === undefined || capacidadmax === null) {
    res.status(400).json({ error: 'La capacidad maxima es obligatoria' });
    return;
  }
  const nuevoVehiculo = await repository.add(
    new Vehiculo(undefined, Number(capacidadmax))
  );
  res.status(201).json(nuevoVehiculo);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, capacidadmax } = req.body.sanitizeInput;
  if (capacidadmax === undefined || capacidadmax === null) {
    res.status(400).json({ error: 'La capacidad maxima es obligatoria' });
    return;
  }
  const vehiculoActualizado = await repository.update(
    new Vehiculo(id, Number(capacidadmax))
  );
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
