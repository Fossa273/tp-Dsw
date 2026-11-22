import { prisma } from '../shared/db/connection.js';
import { ApiError } from '../shared/api-error.js';

export class VehicleCategoryRepository {
  findAll() { return prisma.vehicleCategory.findMany({ include: { priceHistory: { orderBy: { createdAt: 'desc' } } }, orderBy: { idCategoria: 'asc' } }); }
  findOne(id: number) { return prisma.vehicleCategory.findUnique({ where: { idCategoria: id } }); }
  async updatePrice(id: number, precioBase: number) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.vehicleCategory.update({ where: { idCategoria: id }, data: { precioBase } });
      await tx.vehicleCategoryPrice.create({ data: { categoryId: id, precioBase } });
      return category;
    });
  }
  async updateSettings(id: number, precioBase: number, litrosPorKm: number) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.vehicleCategory.findUnique({
        where: { idCategoria: id },
        select: { precioBase: true },
      });
      if (!current) {
        throw new ApiError(
          404,
          'Categoria no encontrada',
          undefined,
          'VEHICLE_CATEGORY_NOT_FOUND'
        );
      }

      const category = await tx.vehicleCategory.update({
        where: { idCategoria: id },
        data: { precioBase, litrosPorKm },
      });
      if (current.precioBase !== precioBase) {
        await tx.vehicleCategoryPrice.create({
          data: { categoryId: id, precioBase },
        });
      }
      return category;
    });
  }
  updateFuelConsumption(id: number, litrosPorKm: number) {
    return prisma.vehicleCategory.update({
      where: { idCategoria: id },
      data: { litrosPorKm },
    });
  }
}