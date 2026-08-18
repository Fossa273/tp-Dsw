import { Request, Response } from 'express';
import { clienteRepository } from './cliente.repository.js';
import { Cliente } from './cliente.entity.js';

const repository = new clienteRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const cliente = await repository.findOne({ id });
  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { id, nombre, apellido, email, telefono } = req.body.sanitizeInput;
  const nuevoCliente = new Cliente(id, nombre, apellido, email, telefono);
  const nuevocliente = await repository.add(nuevoCliente);
  res.status(201).json(nuevocliente);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const clienteactualizado = await repository.update(req.body.sanitizeInput);
  if (clienteactualizado) {
    res.status(200).json(clienteactualizado);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedCliente = await repository.delete({ id });
  if (deletedCliente) {
    res.json({ message: 'Cliente dado de baja' });
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

export { findAll, findOne, add, update, remove };
