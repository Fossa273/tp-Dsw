import { Request, Response } from 'express';
import { LocalityRepository } from './locality.repository.js';

const repository = new LocalityRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
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
  const newLocality = await repository.add({ name });
  res.status(201).json(newLocality);
}

async function update(req: Request, res: Response) {
  const { name } = req.body.sanitizeInput;
  const id = Number(req.params.id);
  if (!name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existing = await repository.findByName(name);
  if (existing && existing.id !== id) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${name}"`,
    });
    return;
  }
  const updatedLocality = await repository.update({ id, name });
  if (updatedLocality) {
    res.status(200).json(updatedLocality);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedLocality = await repository.delete({ id });
    if (deletedLocality) {
      res.json({ message: 'Localidad eliminada' });
    } else {
      res.status(404).json({ error: 'Localidad no encontrada' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Localidad no encontrada' });
      return;
    }
    if (err?.code === 'P2003') {
      res.status(409).json({
        error: 'No se puede eliminar la localidad porque tiene trayectos asociados',
      });
      return;
    }
    throw err;
  }
}

export { findAll, findOne, add, update, remove };
