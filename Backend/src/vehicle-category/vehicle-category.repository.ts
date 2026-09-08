import { prisma } from '../shared/db/connection.js';

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
}