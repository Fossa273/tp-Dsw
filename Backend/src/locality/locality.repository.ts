import { prisma } from '../shared/db/connection.js';

export interface LocalityData {
  id?: number;
  name?: string;
}

export class LocalityRepository {
  public async findAll() {
    return prisma.locality.findMany();
  }

  public async findOne(item: { id: number }) {
    return prisma.locality.findUnique({ where: { id: item.id } });
  }

  // Find a locality by name (to validate duplicates)
  public async findByName(name: string) {
    return prisma.locality.findFirst({ where: { name } });
  }

  public async add(item: LocalityData) {
    return prisma.locality.create({ data: { name: item.name ?? null } });
  }

  public async update(item: LocalityData) {
    if (item.id === undefined) {
      return undefined;
    }
    if (item.name === undefined) {
      return prisma.locality.findUnique({ where: { id: item.id } });
    }
    return prisma.locality.update({
      where: { id: item.id },
      data: { name: item.name },
    });
  }

  public async delete(item: { id: number }) {
    return prisma.locality.delete({ where: { id: item.id } });
  }
}
