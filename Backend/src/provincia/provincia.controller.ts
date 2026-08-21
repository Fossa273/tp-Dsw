import { Request, Response } from 'express';
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
  const { nombreprov } = req.body.sanitizeInput;
  if (!nombreprov) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existente = await repository.findByName(nombreprov);
  if (existente) {
    res.status(409).json({
      error: `Ya existe una provincia con el nombre "${nombreprov}" (ID: ${existente.id})`,
    });
    return;
  }
  const nuevaProvincia = await repository.add(
    new Provincia(undefined, nombreprov)
  );
  res.status(201).json(nuevaProvincia);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, nombreprov } = req.body.sanitizeInput;
  if (!nombreprov) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existente = await repository.findByName(nombreprov);
  if (existente && String(existente.id) !== String(id)) {
    res.status(409).json({
      error: `Ya existe una provincia con el nombre "${nombreprov}" (ID: ${existente.id})`,
    });
    return;
  }
  const provinciaactualizada = await repository.update(
    new Provincia(id, nombreprov)
  );
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
