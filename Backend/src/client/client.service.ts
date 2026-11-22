import { createHash } from 'node:crypto';
import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { ADMIN_EMAIL } from '../shared/constants.js';
import { signAuthToken } from '../middleware/auth.middleware.js';
import {
  validateDni,
  validatePersonContact,
  validatePhone,
} from '../shared/person-validation.js';
import { ClientRepository } from './client.repository.js';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export class ClientService {
  constructor(private readonly repository = new ClientRepository()) {}

  private isAdminEmail(value: unknown): boolean {
    return typeof value === 'string' &&
      value.trim().toLowerCase() === ADMIN_EMAIL;
  }

  async findAll(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 20));
    const search = typeof query.search === 'string' ? query.search : '';
    const sort = ['dni', 'name', 'id'].includes(String(query.sort))
      ? String(query.sort)
      : 'dni';
    const order = query.order === 'desc' ? 'desc' : 'asc';
    if (query.page || query.limit || search) {
      return this.repository.paginated(page, limit, search, sort, order);
    }
    return { data: await this.repository.findAll() };
  }

  findAllInactive() {
    return this.repository.findAllInactive();
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de cliente no es valido');
    }
    const client = await this.repository.findOne({ id });
    if (!client) throw new ApiError(404, 'Cliente no encontrado');
    return client;
  }

  async add(input: {
    firstName?: unknown;
    lastName?: unknown;
    dni?: unknown;
    email?: unknown;
    phone?: unknown;
    password?: unknown;
  }) {
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const dni = typeof input.dni === 'string' ? input.dni.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    if (!email || !password) {
      throw new ApiError(
        400,
        'Email y contraseña son obligatorios para registrarse'
      );
    }
    if (!dni || !phone) {
      throw new ApiError(400, 'El DNI y el telefono son obligatorios');
    }
    const contactError = validatePersonContact(dni, phone);
    if (contactError) throw new ApiError(400, contactError);
    if (this.isAdminEmail(email)) {
      throw new ApiError(403, 'No se puede usar el email del administrador');
    }
    if (await this.repository.findByEmailWithPassword(email)) {
      throw new ApiError(409, 'Ya existe una cuenta con ese email');
    }
    const created = await this.repository.add({
      firstName: typeof input.firstName === 'string' ? input.firstName.trim() : '',
      lastName: typeof input.lastName === 'string' ? input.lastName.trim() : '',
      dni,
      email,
      phone,
      password: hashPassword(password),
    });
    const { password: _password, ...safeCreated } = created;
    return safeCreated;
  }

  async update(rawId: unknown, input: {
    firstName?: unknown;
    lastName?: unknown;
    dni?: unknown;
    email?: unknown;
    phone?: unknown;
    password?: unknown;
  }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de cliente no es valido');
    }
    const current = await this.repository.findOne({ id });
    if (!current) throw new ApiError(404, 'Cliente no encontrado');

    if (input.dni !== undefined) {
      const error = validateDni(input.dni);
      if (error) throw new ApiError(400, error);
    }
    if (input.phone !== undefined) {
      const error = validatePhone(input.phone);
      if (error) throw new ApiError(400, error);
    }
    if (this.isAdminEmail(current.email)) {
      if (input.email !== undefined &&
          !this.isAdminEmail(input.email)) {
        throw new ApiError(
          403,
          'No se puede cambiar el email del administrador'
        );
      }
    } else if (input.email !== undefined && this.isAdminEmail(input.email)) {
      throw new ApiError(
        403,
        'No se puede usar el email del administrador'
      );
    }
    if (input.email !== undefined) {
      const email = String(input.email).trim();
      const existing = await this.repository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new ApiError(409, 'Ya existe una cuenta con ese email');
      }
    }
    const password = typeof input.password === 'string' && input.password
      ? hashPassword(input.password)
      : undefined;
    const updated = await this.repository.update({
      id,
      ...(typeof input.firstName === 'string'
        ? { firstName: input.firstName.trim() } : {}),
      ...(typeof input.lastName === 'string'
        ? { lastName: input.lastName.trim() } : {}),
      ...(input.dni !== undefined ? { dni: String(input.dni).trim() } : {}),
      ...(input.email !== undefined ? { email: String(input.email).trim() } : {}),
      ...(input.phone !== undefined ? { phone: String(input.phone).trim() } : {}),
      ...(password ? { password } : {}),
    });
    if (!updated) throw new ApiError(404, 'Cliente no encontrado');
    return updated;
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de cliente no es valido');
    }
    const current = await this.repository.findOne({ id });
    if (!current) throw new ApiError(404, 'Cliente no encontrado');
    if (this.isAdminEmail(current.email)) {
      throw new ApiError(403, 'No se puede dar de baja al administrador');
    }
    const deleted = await this.repository.delete({ id });
    if (!deleted) throw new ApiError(404, 'Cliente no encontrado');
    return { message: 'Cliente dado de baja' };
  }

  async login(emailValue: unknown, passwordValue: unknown) {
    const email = typeof emailValue === 'string' ? emailValue.trim() : '';
    const password = typeof passwordValue === 'string' ? passwordValue : '';
    if (!email || !password) {
      throw new ApiError(400, 'Email y contraseña son obligatorios');
    }
    const client = await this.repository.findByEmailWithPassword(email);
    if (!client || client.password !== hashPassword(password)) {
      throw new ApiError(401, 'Email o contraseña incorrectos');
    }
    await this.repository.setLogged(client.id, true);
    const { password: _password, ...safeClient } = client;
    const role = this.isAdminEmail(client.email) ? 'admin' : 'client';
    return {
      message: 'Sesion iniciada',
      data: {
        ...safeClient,
        role,
        logged: 1,
        token: signAuthToken({
          id: client.id,
          email: client.email || '',
          role,
        }),
      },
    };
  }

  async logout(rawId: unknown) {
    if (rawId === undefined || rawId === null) {
      throw new ApiError(400, 'Falta el id del cliente');
    }
    const ok = await this.repository.setLogged(Number(rawId), false);
    if (!ok) throw new ApiError(404, 'Cliente no encontrado');
    return { message: 'Sesion cerrada' };
  }

  async resetPassword(emailValue: unknown, passwordValue: unknown) {
    const email = typeof emailValue === 'string' ? emailValue.trim() : '';
    const password = typeof passwordValue === 'string' ? passwordValue : '';
    if (!email || !password) {
      throw new ApiError(
        400,
        'Debe indicar el email y la nueva contraseña'
      );
    }
    const ok = await this.repository.updatePasswordByEmail(
      email,
      hashPassword(password)
    );
    if (!ok) throw new ApiError(404, 'No existe una cuenta con ese email');
    return { message: 'Contraseña actualizada correctamente' };
  }

  async reactivate(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de cliente no es valido');
    }
    if (!await this.repository.reactivate(id)) {
      throw new ApiError(
        404,
        'No se encontro un cliente dado de baja con ese id'
      );
    }
    return { message: 'Cliente dado de alta correctamente' };
  }
}
