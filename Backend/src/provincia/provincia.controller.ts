import express, { Request, Response, NextFunction } from 'express';
import { provinciaRepository } from './provincia.repository.js';
import { Provincia } from './provincia.entity.js';

const repository = new provinciaRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const provincia = await repository.findOne({ id });
  if (provincia) {
    res.json(provincia);
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
  }
}

async function add(req: Request, res: Response) {
  const { id, nombreprov } = req.body.sanitizeInput;
  const nuevaProvincia = new Provincia(id, nombreprov);
  const nuevaprovincia = await repository.add(nuevaProvincia);
  res.status(201).json(nuevaprovincia);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const provinciaactualizada = await repository.update(req.body.sanitizeInput);
  if (provinciaactualizada) {
    res.status(200).json(provinciaactualizada);
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedProvincia = await repository.delete({ id });
  if (deletedProvincia) {
    res.json({ message: 'Provincia eliminada' });
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
  }
}

export { findAll, findOne, add, update, remove };
