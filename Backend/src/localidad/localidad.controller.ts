import express, { Request, Response, NextFunction } from 'express';
import { localidadRepository } from './localidad.repository.js';
import { Localidad } from './localidad.entity.js';

const repository = new localidadRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const localidad = await repository.findOne({ id });
  if (localidad) {
    res.json(localidad);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function add(req: Request, res: Response) {
  const { id, nombre } = req.body.sanitizeInput;
  const nuevaLocalidad = new Localidad(id, nombre);
  const nuevalocalidad = await repository.add(nuevaLocalidad);
  res.status(201).json(nuevalocalidad);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const localidadactualizada = await repository.update(req.body.sanitizeInput);
  if (localidadactualizada) {
    res.status(200).json(localidadactualizada);
  } else {
    res.status(404).json({ error: 'Localidad no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedLocalidad = await repository.delete({ id });
  if (deletedLocalidad) {
    res.json({ message: 'Localidad eliminado' });
  } else {
    res.status(404).json({ error: 'Localidad no encontrado' });
  }
}

export { findAll, findOne, add, update, remove };
