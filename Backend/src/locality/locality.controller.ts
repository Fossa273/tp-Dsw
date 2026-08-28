import { Request, Response } from 'express';
import { LocalityRepository } from './locality.repository.js';
import { Locality } from './locality.entity.js';

const repository = new LocalityRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const locality = await repository.findOne({ id });
  if (locality) {
    res.json(locality);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function add(req: Request, res: Response) {
  const { name } = req.body.sanitizeInput;
  if (!name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existing = await repository.findByName(name);
  if (existing) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${name}"`,
    });
    return;
  }
  const newLocality = await repository.add(new Locality(undefined, name));
  res.status(201).json(newLocality);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, name } = req.body.sanitizeInput;
  if (!name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existing = await repository.findByName(name);
  if (existing && String(existing.id) !== String(id)) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${name}"`,
    });
    return;
  }
  const updatedLocality = await repository.update(new Locality(id, name));
  if (updatedLocality) {
    res.status(200).json(updatedLocality);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedLocality = await repository.delete({ id });
  if (deletedLocality) {
    res.json({ message: 'Localidad eliminada' });
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

export { findAll, findOne, add, update, remove };