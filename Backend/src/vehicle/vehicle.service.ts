import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { VehicleCategoryRepository } from '../vehicle-category/vehicle-category.repository.js';
import { VehicleRepository } from './vehicle.repository.js';

export class VehicleService {
  constructor(
    private readonly repository = new VehicleRepository(),
    private readonly categoryRepository = new VehicleCategoryRepository()
  ) {}

  findAll() {
    return this.repository.findAll();
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de vehiculo no es valido');
    }
    const vehicle = await this.repository.findOne({ id });
    if (!vehicle) {
      throw new ApiError(404, 'Vehiculo no encontrado');
    }
    return vehicle;
  }

  private async validate(rawMaxCapacity: unknown, rawCategoryId: unknown) {
    if (rawMaxCapacity === undefined || rawMaxCapacity === null) {
      throw new ApiError(400, 'La capacidad maxima es obligatoria');
    }
    const maxCapacity = Number(rawMaxCapacity);
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      throw new ApiError(
        400,
        'La capacidad maxima debe ser un entero mayor a 0'
      );
    }
    if (!isPositiveInteger(rawCategoryId)) {
      throw new ApiError(400, 'La categoria del vehiculo no es valida');
    }
    const category = await this.categoryRepository.findOne(Number(rawCategoryId));
    if (!category) {
      throw new ApiError(400, 'La categoria del vehiculo no es valida');
    }
    return { maxCapacity, categoryId: Number(rawCategoryId) };
  }

  async add(input: {
    maxCapacity?: unknown;
    categoryId?: unknown;
    hasBathroom?: unknown;
    maintenance?: unknown;
  }) {
    const values = await this.validate(input.maxCapacity, input.categoryId);
    return this.repository.add({
      ...values,
      hasBathroom: Boolean(input.hasBathroom),
      maintenance: Boolean(input.maintenance),
    });
  }

  async update(rawId: unknown, input: {
    maxCapacity?: unknown;
    categoryId?: unknown;
    hasBathroom?: unknown;
    maintenance?: unknown;
  }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de vehiculo no es valido');
    }
    await this.findOne(id);
    const values = await this.validate(input.maxCapacity, input.categoryId);
    const vehicle = await this.repository.update({
      id,
      ...values,
      ...(input.hasBathroom !== undefined
        ? { hasBathroom: Boolean(input.hasBathroom) }
        : {}),
      ...(input.maintenance !== undefined
        ? { maintenance: Boolean(input.maintenance) }
        : {}),
    });
    if (!vehicle) {
      throw new ApiError(404, 'Vehiculo no encontrado');
    }
    return vehicle;
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de vehiculo no es valido');
    }
    await this.findOne(id);
    const activeTrips = await this.repository.countActiveTrips(id);
    if (activeTrips > 0) {
      throw new ApiError(
        409,
        'No se puede eliminar el vehiculo porque tiene viajes activos asociados'
      );
    }
    await this.repository.delete({ id });
    return { message: 'Vehiculo eliminado' };
  }
}
