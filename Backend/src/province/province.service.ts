import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { ProvinceRepository } from './province.repository.js';

export class ProvinceService {
  constructor(private readonly repository = new ProvinceRepository()) {}

  findAll() {
    return this.repository.findAll();
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de provincia no es valido');
    }
    const province = await this.repository.findOne({ id });
    if (!province) {
      throw new ApiError(404, 'Provincia no encontrada');
    }
    return province;
  }

  async add(name: unknown) {
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName) {
      throw new ApiError(400, 'El nombre es obligatorio');
    }
    const existing = await this.repository.findByName(normalizedName);
    if (existing) {
      throw new ApiError(409, `Ya existe una provincia con el nombre "${normalizedName}"`);
    }
    return this.repository.add({ name: normalizedName });
  }

  async update(rawId: unknown, name: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de provincia no es valido');
    }
    await this.findOne(id);
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName) {
      throw new ApiError(400, 'El nombre es obligatorio');
    }
    const existing = await this.repository.findByName(normalizedName);
    if (existing && existing.id !== id) {
      throw new ApiError(409, `Ya existe una provincia con el nombre "${normalizedName}"`);
    }
    return this.repository.update({ id, name: normalizedName });
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de provincia no es valido');
    }
    await this.findOne(id);
    const associatedLocalities = await this.repository.countAssociatedLocalities(id);
    if (associatedLocalities > 0) {
      throw new ApiError(
        409,
        'No se puede eliminar la provincia porque tiene localidades asociadas'
      );
    }
    await this.repository.delete({ id });
    return { message: 'Provincia eliminada' };
  }
}
