import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { VehicleCategoryRepository } from './vehicle-category.repository.js';

export class VehicleCategoryService {
  constructor(private readonly repository = new VehicleCategoryRepository()) {}

  findAll() {
    return this.repository.findAll();
  }

  private async findExisting(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de categoria no es valido');
    }
    const category = await this.repository.findOne(id);
    if (!category) {
      throw new ApiError(404, 'Categoria no encontrada');
    }
    return { id, category };
  }

  async updatePrice(rawId: unknown, rawPrice: unknown) {
    const { id } = await this.findExisting(rawId);
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(
        400,
        'El precio base debe ser un numero mayor o igual a 0'
      );
    }
    return this.repository.updatePrice(id, price);
  }

  async updateFuelConsumption(rawId: unknown, rawConsumption: unknown) {
    const { id } = await this.findExisting(rawId);
    const consumption = Number(rawConsumption);
    if (!Number.isFinite(consumption) || consumption <= 0) {
      throw new ApiError(
        400,
        'El consumo debe ser un numero mayor a 0 litros por kilometro'
      );
    }
    return this.repository.updateFuelConsumption(id, consumption);
  }

  async updateSettings(
    rawId: unknown,
    rawPrice: unknown,
    rawConsumption: unknown
  ) {
    const { id } = await this.findExisting(rawId);
    const price = Number(rawPrice);
    const consumption = Number(rawConsumption);
    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(
        400,
        'El precio base debe ser un numero mayor o igual a 0'
      );
    }
    if (!Number.isFinite(consumption) || consumption <= 0) {
      throw new ApiError(
        400,
        'El consumo debe ser un numero mayor a 0 litros por kilometro'
      );
    }
    return this.repository.updateSettings(id, price, consumption);
  }
}
