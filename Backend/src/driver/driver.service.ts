import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import {
  validateDni,
  validatePersonContact,
  validatePhone,
} from '../shared/person-validation.js';
import { DriverRepository } from './driver.repository.js';

export class DriverService {
  constructor(private readonly repository = new DriverRepository()) {}

  findAll() {
    return this.repository.findAll();
  }

  findAllInactive() {
    return this.repository.findAllInactive();
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de conductor no es valido');
    }
    const driver = await this.repository.findOne({ id });
    if (!driver) {
      throw new ApiError(404, 'Conductor no encontrado');
    }
    return driver;
  }

  async add(input: {
    dni?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    phone?: unknown;
  }) {
    const dni = typeof input.dni === 'string' ? input.dni.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    if (!dni || !phone) {
      throw new ApiError(400, 'El DNI y el telefono son obligatorios');
    }
    const contactError = validatePersonContact(dni, phone);
    if (contactError) {
      throw new ApiError(400, contactError);
    }
    if (await this.repository.findByDni(dni)) {
      throw new ApiError(409, 'Ya existe un conductor con ese DNI');
    }
    return this.repository.add({
      dni,
      firstName: typeof input.firstName === 'string' ? input.firstName.trim() : '',
      lastName: typeof input.lastName === 'string' ? input.lastName.trim() : '',
      phone,
    });
  }

  async update(rawId: unknown, input: {
    dni?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    phone?: unknown;
  }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de conductor no es valido');
    }
    await this.findOne(id);
    if (input.dni !== undefined) {
      const error = validateDni(input.dni);
      if (error) throw new ApiError(400, error);
    }
    if (input.phone !== undefined) {
      const error = validatePhone(input.phone);
      if (error) throw new ApiError(400, error);
    }
    if (input.dni !== undefined) {
      const dni = String(input.dni).trim();
      const existing = await this.repository.findByDni(dni);
      if (existing && existing.id !== id) {
        throw new ApiError(409, 'Ya existe un conductor con ese DNI');
      }
    }
    const updated = await this.repository.update({
      id,
      ...(input.dni !== undefined ? { dni: String(input.dni).trim() } : {}),
      ...(typeof input.firstName === 'string'
        ? { firstName: input.firstName.trim() }
        : {}),
      ...(typeof input.lastName === 'string'
        ? { lastName: input.lastName.trim() }
        : {}),
      ...(input.phone !== undefined ? { phone: String(input.phone).trim() } : {}),
    });
    if (!updated) {
      throw new ApiError(404, 'Conductor no encontrado');
    }
    return updated;
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de conductor no es valido');
    }
    await this.findOne(id);
    await this.repository.delete({ id });
    return { message: 'Conductor dado de baja' };
  }

  async reactivate(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de conductor no es valido');
    }
    const ok = await this.repository.reactivate(id);
    if (!ok) {
      throw new ApiError(
        404,
        'No se encontro un conductor dado de baja con ese id'
      );
    }
    return { message: 'Conductor dado de alta correctamente' };
  }
}
