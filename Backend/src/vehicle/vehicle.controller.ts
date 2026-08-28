import { Request, Response } from 'express';
import { VehicleRepository } from './vehicle.repository.js';
import { Vehicle } from './vehicle.entity.js';

const repository = new VehicleRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const vehicle = await repository.findOne({ id });
  if (vehicle) {
    res.json(vehicle);
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { maxCapacity } = req.body.sanitizeInput;
  if (maxCapacity === undefined || maxCapacity === null) {
    res.status(400).json({ error: 'La capacidad maxima es obligatoria' });
    return;
  }
  const newVehicle = await repository.add(
    new Vehicle(undefined, Number(maxCapacity))
  );
  res.status(201).json(newVehicle);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, maxCapacity } = req.body.sanitizeInput;
  if (maxCapacity === undefined || maxCapacity === null) {
    res.status(400).json({ error: 'La capacidad maxima es obligatoria' });
    return;
  }
  const updatedVehicle = await repository.update(
    new Vehicle(id, Number(maxCapacity))
  );
  if (updatedVehicle) {
    res.status(200).json(updatedVehicle);
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedVehicle = await repository.delete({ id });
  if (deletedVehicle) {
    res.json({ message: 'Vehiculo eliminado' });
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

export { findAll, findOne, add, update, remove };