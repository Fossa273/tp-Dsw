import express, { Request, Response, NextFunction } from 'express';
import { clienteRepository } from './cliente.repository.js';
import { Cliente } from './cliente.entity.js';

const repository = new clienteRepository();

function sanitizeClienteInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizeInput = {
    id: req.body.id,
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    email: req.body.email,
    telefono: req.body.telefono,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

function findAll(req: Request, res: Response) {
  res.json({ data: repository.findAll() });
}

function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const cliente = repository.findOne({ id });
  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

function add(req: Request, res: Response) {
  const { id, nombre, apellido, email, telefono } = req.body.sanitizeInput;
  const nuevoCliente = new Cliente(id, nombre, apellido, email, telefono);
  const nuevocliente = repository.add(nuevoCliente);
  res.status(201).json(nuevocliente);
}

function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const clienteactualizado = repository.update(req.body.sanitizeInput);
  if (clienteactualizado) {
    res.status(200).json(clienteactualizado);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedCliente = repository.delete({ id });
  if (deletedCliente) {
    res.json({ message: 'Cliente eliminado' });
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

export { sanitizeClienteInput, findAll, findOne, add, update, remove };
