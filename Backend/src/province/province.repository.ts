import { prisma } from '../shared/db/connection.js';

export interface ProvinceData {
  id?: number;
  name?: string;
}

export class ProvinceRepository {
  public async findAll() {
    return prisma.province.findMany();
  }

  public async findOne(item: { id: number }) {
    return prisma.province.findUnique({ where: { id: item.id } });
  }

  // Find a province by name (to validate duplicates)
  public async findByName(name: string) {
    return prisma.province.findFirst({ where: { name } });
  }

  public async add(item: ProvinceData) {
    return prisma.province.create({ data: { name: item.name ?? null } });
  }

  public async update(item: ProvinceData) {
    if (item.id === undefined || item.name === undefined) {
      return undefined;
    }
    return prisma.province.update({
      where: { id: item.id },
      data: { name: item.name },
    });
  }

  public async delete(item: { id: number }) {
    return prisma.province.delete({ where: { id: item.id } });
  }
}
