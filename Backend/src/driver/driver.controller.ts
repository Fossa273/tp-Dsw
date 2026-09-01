import { Request, Response } from 'express';
import { DriverRepository } from './driver.repository.js';

const repository = new DriverRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

// Inactive drivers listing (admin only)
async function findAllInactive(req: Request, res: Response) {
  res.json({ data: await repository.findAllInactive() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const driver = await repository.findOne({ id });
  if (driver) {
    res.json(driver);
  } else {
    res.status(404).json({ error: 'Conductor no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { dni, firstName, lastName, phone } = req.body.sanitizeInput;

  if (!dni) {
    res.status(400).json({ error: 'El DNI es obligatorio' });
    return;
  }

  const existing = await repository.findByDni(dni);
  if (existing) {
    res.status(409).json({ error: 'Ya existe un conductor con ese DNI' });
    return;
  }

  const created = await repository.add({ dni, firstName, lastName, phone });
  res.status(201).json(created);
}

async function update(req: Request, res: Response) {
  const { dni, firstName, lastName, phone } = req.body.sanitizeInput;
  const id = Number(req.params.id);

  if (dni !== undefined) {
    const existing = await repository.findByDni(dni);
    if (existing && existing.id !== id) {
      res.status(409).json({ error: 'Ya existe un conductor con ese DNI' });
      return;
    }
  }

  const updatedDriver = await repository.update({
    id,
    dni,
    firstName,
    lastName,
    phone,
  });
  if (updatedDriver) {
    res.status(200).json(updatedDriver);
  } else {
    res.status(404).json({ error: 'Conductor no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const deletedDriver = await repository.delete({ id });
  if (deletedDriver) {
    res.json({ message: 'Conductor dado de baja' });
  } else {
    res.status(404).json({ error: 'Conductor no encontrado' });
  }
}

// Reactivate a driver that was logically deleted (admin only)
async function reactivate(req: Request, res: Response) {
  const id = Number(req.params.id);
  const ok = await repository.reactivate(id);
  if (!ok) {
    res
      .status(404)
      .json({ error: 'No se encontro un conductor dado de baja con ese id' });
    return;
  }
  res.json({ message: 'Conductor dado de alta correctamente' });
}

export { findAll, findAllInactive, findOne, add, update, remove, reactivate };
