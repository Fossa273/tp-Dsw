import { prisma } from '../shared/db/connection.js';

export interface VehicleData {
  id?: number;
  maxCapacity?: number;
}

export class VehicleRepository {
  public async findAll() {
    return prisma.vehicle.findMany();
  }

  public async findOne(item: { id: number }) {
    return prisma.vehicle.findUnique({ where: { id: item.id } });
  }

  public async add(item: VehicleData) {
    return prisma.vehicle.create({
      data: { maxCapacity: item.maxCapacity ?? 0 },
    });
  }

  public async update(item: VehicleData) {
    if (item.id === undefined || item.maxCapacity === undefined) {
      return undefined;
    }
    return prisma.vehicle.update({
      where: { id: item.id },
      data: { maxCapacity: item.maxCapacity },
    });
  }

  public async delete(item: { id: number }) {
    return prisma.vehicle.delete({ where: { id: item.id } });
  }
}
