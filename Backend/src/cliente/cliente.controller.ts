import { Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { clienteRepository } from './cliente.repository.js';
import { Cliente } from './cliente.entity.js';

const repository = new clienteRepository();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

// Listado de clientes dados de baja (solo administrador)
async function findAllInactivos(req: Request, res: Response) {
  res.json({ data: await repository.findAllInactivos() });
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

// Registro de cliente (con password para login)
async function add(req: Request, res: Response) {
  const { nombre, apellido, dni, email, telefono, password } =
    req.body.sanitizeInput;

  if (!email || !password) {
    res
      .status(400)
      .json({ error: 'Email y contraseña son obligatorios para registrarse' });
    return;
  }

  const existente = await repository.findByEmailWithPassword(email);
  if (existente) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    return;
  }

  const nuevoCliente = new Cliente(
    undefined,
    nombre,
    apellido,
    dni,
    email,
    telefono,
    1,
    hashPassword(password),
    0
  );
  const creado = await repository.add(nuevoCliente);
  res.status(201).json(creado);
}

async function update(req: Request, res: Response) {
  req.body.sanitizeInput.id = req.params.id;
  const { id, nombre, apellido, dni, email, telefono, password } =
    req.body.sanitizeInput;
  const clienteactualizado = await repository.update(
    new Cliente(
      id,
      nombre,
      apellido,
      dni,
      email,
      telefono,
      1,
      password ? hashPassword(password) : undefined
    )
  );
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

// ------------------- AUTH -------------------

async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    return;
  }

  const cliente = await repository.findByEmailWithPassword(email);
  if (!cliente || cliente.password !== hashPassword(password)) {
    res.status(401).json({ error: 'Email o contraseña incorrectos' });
    return;
  }

  await repository.setLogged(String(cliente.id), true);
  const { password: _p, ...clienteSeguro } = cliente;
  res.json({ message: 'Sesion iniciada', data: { ...clienteSeguro, logged: 1 } });
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

// Cambio de contrasena solo con el email (pagina de prueba)
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

// Reactiva un cliente que estaba dado de baja (solo administrador)
async function reactivar(req: Request, res: Response) {
  const id = String(req.params.id);
  const ok = await repository.reactivar(id);
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
  findAllInactivos,
  findOne,
  add,
  update,
  remove,
  login,
  logout,
  resetPassword,
  reactivar,
};
