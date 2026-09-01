import { Request, Response } from 'express';
import { VehicleRepository } from './vehicle.repository.js';

const repository = new VehicleRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
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
  const cap = Number(maxCapacity);
  if (!Number.isInteger(cap) || cap < 1) {
    res
      .status(400)
      .json({ error: 'La capacidad maxima debe ser un entero mayor a 0' });
    return;
  }
  const newVehicle = await repository.add({ maxCapacity: cap });
  res.status(201).json(newVehicle);
}

async function update(req: Request, res: Response) {
  const { maxCapacity } = req.body.sanitizeInput;
  if (maxCapacity === undefined || maxCapacity === null) {
    res.status(400).json({ error: 'La capacidad maxima es obligatoria' });
    return;
  }
  const cap = Number(maxCapacity);
  if (!Number.isInteger(cap) || cap < 1) {
    res
      .status(400)
      .json({ error: 'La capacidad maxima debe ser un entero mayor a 0' });
    return;
  }
  const updatedVehicle = await repository.update({
    id: Number(req.params.id),
    maxCapacity: cap,
  });
  if (updatedVehicle) {
    res.status(200).json(updatedVehicle);
  } else {
    res.status(404).json({ error: 'Vehiculo no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedVehicle = await repository.delete({ id });
    if (deletedVehicle) {
      res.json({ message: 'Vehiculo eliminado' });
    } else {
      res.status(404).json({ error: 'Vehiculo no encontrado' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Vehiculo no encontrado' });
      return;
    }
    if (err?.code === 'P2003') {
      res.status(409).json({
        error: 'No se puede eliminar el vehiculo porque tiene viajes asociados',
      });
      return;
    }
    throw err;
  }
}

export { findAll, findOne, add, update, remove };
