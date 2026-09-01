import { Request, Response } from 'express';
import { ProvinceRepository } from './province.repository.js';

const repository = new ProvinceRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const province = await repository.findOne({ id });
  if (province) {
    res.json(province);
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
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
      error: `Ya existe una provincia con el nombre "${name}"`,
    });
    return;
  }
  const newProvince = await repository.add({ name });
  res.status(201).json(newProvince);
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
      error: `Ya existe una provincia con el nombre "${name}"`,
    });
    return;
  }
  const updatedProvince = await repository.update({ id, name });
  if (updatedProvince) {
    res.status(200).json(updatedProvince);
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const deletedProvince = await repository.delete({ id });
  if (deletedProvince) {
    res.json({ message: 'Provincia eliminada' });
  } else {
    res.status(404).json({ error: 'Provincia no encontrada' });
  }
}

export { findAll, findOne, add, update, remove };
