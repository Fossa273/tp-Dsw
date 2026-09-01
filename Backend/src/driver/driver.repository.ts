import { prisma } from '../shared/db/connection.js';

const PUBLIC_SELECT = {
  id: true,
  dni: true,
  firstName: true,
  lastName: true,
  phone: true,
  active: true,
} as const;

export interface DriverData {
  id?: number;
  dni?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  active?: number;
}

export class DriverRepository {
  public async findAll() {
    return prisma.driver.findMany({
      where: { active: 1 },
      select: PUBLIC_SELECT,
    });
  }

  // Drivers with logical deletion (for the admin-only listing)
  public async findAllInactive() {
    return prisma.driver.findMany({
      where: { active: 0 },
      select: PUBLIC_SELECT,
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.driver.findFirst({
      where: { id: item.id, active: 1 },
      select: PUBLIC_SELECT,
    });
  }

  public async findByDni(dni: string) {
    return prisma.driver.findFirst({
      where: { dni },
      select: PUBLIC_SELECT,
    });
  }

  public async add(item: DriverData) {
    return prisma.driver.create({
      data: {
        dni: item.dni ?? null,
        firstName: item.firstName ?? null,
        lastName: item.lastName ?? null,
        phone: item.phone ?? null,
        active: 1,
      },
      select: PUBLIC_SELECT,
    });
  }

  public async update(item: DriverData) {
    const data: Record<string, unknown> = {};
    if (item.dni !== undefined) data.dni = item.dni;
    if (item.firstName !== undefined) data.firstName = item.firstName;
    if (item.lastName !== undefined) data.lastName = item.lastName;
    if (item.phone !== undefined) data.phone = item.phone;

    if (Object.keys(data).length === 0 || item.id === undefined) {
      return undefined;
    }

    return prisma.driver.update({
      where: { id: item.id },
      data: data as any,
      select: PUBLIC_SELECT,
    });
  }

  public async delete(item: { id: number }) {
    return prisma.driver.update({
      where: { id: item.id },
      data: { active: 0 },
      select: PUBLIC_SELECT,
    });
  }

  // Reactivate a logically deleted driver
  public async reactivate(id: number): Promise<boolean> {
    const result = await prisma.driver.updateMany({
      where: { id, active: 0 },
      data: { active: 1 },
    });
    return result.count > 0;
  }
}
