import { prisma } from '../shared/db/connection.js';

export interface VehicleData {
  id?: number;
  maxCapacity?: number;
    categoryId?: number;
  hasBathroom?: boolean;
  maintenance?: boolean;
}

export class VehicleRepository {
  public async findAll() {
    return prisma.vehicle.findMany({ include: { categoryRelation: true } });
  }

  public async findOne(item: { id: number }) {
    return prisma.vehicle.findUnique({ where: { id: item.id }, include: { categoryRelation: true } });
  }

  public async add(item: VehicleData) {
    return prisma.vehicle.create({
      data: {
        maxCapacity: item.maxCapacity ?? 0,
          categoryId: item.categoryId ?? 1,
        hasBathroom: item.hasBathroom ?? false,
        maintenance: item.maintenance ?? false,
      },
      include: { categoryRelation: true },
    });
  }

  public async update(item: VehicleData) {
    if (item.id === undefined) {
      return undefined;
    }
      if (item.maxCapacity === undefined && item.categoryId === undefined && item.hasBathroom === undefined && item.maintenance === undefined) {
        return prisma.vehicle.findUnique({ where: { id: item.id }, include: { categoryRelation: true } });
    }
    return prisma.vehicle.update({
      where: { id: item.id },
      data: {
        ...(item.maxCapacity !== undefined ? { maxCapacity: item.maxCapacity } : {}),
          ...(item.categoryId !== undefined ? { categoryId: item.categoryId } : {}),
        ...(item.hasBathroom !== undefined ? { hasBathroom: item.hasBathroom } : {}),
        ...(item.maintenance !== undefined ? { maintenance: item.maintenance } : {}),
      },
      include: { categoryRelation: true },
    });
  }

  public async delete(item: { id: number }) {
    return prisma.vehicle.delete({ where: { id: item.id } });
  }
}
