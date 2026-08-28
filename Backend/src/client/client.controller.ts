import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { ClientRepository } from './client.repository.js';
import { Client } from './client.entity.js';

const repository = new ClientRepository();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

// Inactive clients listing (admin only)
async function findAllInactive(req: Request, res: Response) {
  res.json({ data: await repository.findAllInactive() });
}

async function findOne(req: Request, res: Response) {
  const id = String(req.params.id);
  const client = await repository.findOne({ id });
  if (client) {
    res.json(client);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

// Client registration (with password for login)
async function add(req: Request, res: Response) {
  const { firstName, lastName, dni, email, phone, password } =
    req.body.sanitizeInput;

  if (!email || !password) {
    res
      .status(400)
      .json({ error: 'Email y contraseña son obligatorios para registrarse' });
    return;
  }

  const existing = await repository.findByEmailWithPassword(email);
  if (existing) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    return;
  }

  const newClient = new Client(
    undefined,
    firstName,
    lastName,
    dni,
    email,
    phone,
    1,
    hashPassword(password),
    0
  );
  const created = await repository.add(newClient);
  res.status(201).json(created);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, firstName, lastName, dni, email, phone, password } =
    req.body.sanitizeInput;
  const updatedClient = await repository.update(
    new Client(
      id,
      firstName,
      lastName,
      dni,
      email,
      phone,
      1,
      password ? hashPassword(password) : undefined
    )
  );
  if (updatedClient) {
    res.status(200).json(updatedClient);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = String(req.params.id);
  const deletedClient = await repository.delete({ id });
  if (deletedClient) {
    res.json({ message: 'Cliente dado de baja' });
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}

// ------------------- AUTH -------------------

async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    return;
  }

  const client = await repository.findByEmailWithPassword(email);
  if (!client || client.password !== hashPassword(password)) {
    res.status(401).json({ error: 'Email o contraseña incorrectos' });
    return;
  }

  await repository.setLogged(String(client.id), true);
  const { password: _p, ...safeClient } = client;
  res.json({
    message: 'Sesion iniciada',
    data: { ...safeClient, logged: 1 },
  });
}

async function logout(req: Request, res: Response) {
  const { id } = req.body || {};
  if (id === undefined || id === null) {
    res.status(400).json({ error: 'Falta el id del cliente' });
    return;
  }
  const ok = await repository.setLogged(String(id), false);
  if (!ok) {
    res.status(404).json({ error: 'Cliente no encontrado' });
    return;
  }
  res.json({ message: 'Sesion cerrada' });
}

// Password reset using only the email (test page)
async function resetPassword(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res
      .status(400)
      .json({ error: 'Debe indicar el email y la nueva contraseña' });
    return;
  }
  const ok = await repository.updatePasswordByEmail(
    email,
    hashPassword(password)
  );
  if (!ok) {
    res.status(404).json({ error: 'No existe una cuenta con ese email' });
    return;
  }
  res.json({ message: 'Contraseña actualizada correctamente' });
}

// Reactivate a client that was logically deleted (admin only)
async function reactivate(req: Request, res: Response) {
  const id = String(req.params.id);
  const ok = await repository.reactivate(id);
  if (!ok) {
    res
      .status(404)
      .json({ error: 'No se encontro un cliente dado de baja con ese id' });
    return;
  }
  res.json({ message: 'Cliente dado de alta correctamente' });
}

export {
  findAll,
  findAllInactive,
  findOne,
  add,
  update,
  remove,
  login,
  logout,
  resetPassword,
  reactivate,
};