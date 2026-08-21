import { Request, Response } from 'express';
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
  const { nombre } = req.body.sanitizeInput;
  if (!nombre) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existente = await repository.findByName(nombre);
  if (existente) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${nombre}" (ID: ${existente.id})`,
    });
    return;
  }
  const nuevaLocalidad = await repository.add(new Localidad(undefined, nombre));
  res.status(201).json(nuevaLocalidad);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, nombre } = req.body.sanitizeInput;
  if (!nombre) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existente = await repository.findByName(nombre);
  if (existente && String(existente.id) !== String(id)) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${nombre}" (ID: ${existente.id})`,
    });
    return;
  }
  const localidadactualizada = await repository.update(
    new Localidad(id, nombre)
  );
  if (localidadactualizada) {
    res.status(200).json(localidadactualizada);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedLocalidad = await repository.delete({ id });
  if (deletedLocalidad) {
    res.json({ message: 'Localidad eliminada' });
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

export { findAll, findOne, add, update, remove };
