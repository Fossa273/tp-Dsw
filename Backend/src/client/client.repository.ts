import { prisma } from '../shared/db/connection.js';

// The administrator is not a regular client and must not appear in the
// clients listing. Identified by a fixed, reserved email.
const ADMIN_EMAIL = 'admin@rutabus.com';

const PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  dni: true,
  email: true,
  phone: true,
  active: true,
  logged: true,
} as const;

export interface ClientData {
  id?: number;
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  phone?: string;
  active?: number;
  password?: string;
  logged?: number;
}

export class ClientRepository {
  public async findAll() {
    return prisma.client.findMany({
      where: { active: 1, email: { not: ADMIN_EMAIL } },
      select: PUBLIC_SELECT,
    });
  }

  // Clients with logical deletion (for the admin-only listing)
  public async findAllInactive() {
    return prisma.client.findMany({
      where: { active: 0 },
      select: PUBLIC_SELECT,
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.client.findFirst({
      where: { id: item.id, active: 1 },
      select: PUBLIC_SELECT,
    });
  }

  // Only for login: also returns the password hash
  public async findByEmailWithPassword(email: string) {
    return prisma.client.findFirst({
      where: { email, active: 1 },
    });
  }

  public async add(item: ClientData) {
    return prisma.client.create({
      data: {
        firstName: item.firstName ?? null,
        lastName: item.lastName ?? null,
        dni: item.dni ?? null,
        email: item.email ?? null,
        phone: item.phone ?? null,
        active: 1,
        password: item.password ?? null,
        logged: 0,
      },
    });
  }

  public async update(item: ClientData) {
    const data: Record<string, unknown> = {};
    if (item.firstName !== undefined) data.firstName = item.firstName;
    if (item.lastName !== undefined) data.lastName = item.lastName;
    if (item.dni !== undefined) data.dni = item.dni;
    if (item.email !== undefined) data.email = item.email;
    if (item.phone !== undefined) data.phone = item.phone;
    if (item.password) data.password = item.password;

    if (item.id === undefined) {
      return undefined;
    }
    if (Object.keys(data).length === 0) {
      return prisma.client.findUnique({ where: { id: item.id }, select: PUBLIC_SELECT });
    }

    return prisma.client.update({
      where: { id: item.id },
      data: data as any,
      select: PUBLIC_SELECT,
    });
  }

  public async delete(item: { id: number }) {
    return prisma.client.update({
      where: { id: item.id },
      data: { active: 0, logged: 0 },
      select: PUBLIC_SELECT,
    });
  }

  public async setLogged(id: number, loggedValue: boolean): Promise<boolean> {
    const result = await prisma.client.updateMany({
      where: { id, active: 1 },
      data: { logged: loggedValue ? 1 : 0 },
    });
    return result.count > 0;
  }

  // Reactivate a logically deleted client
  public async reactivate(id: number): Promise<boolean> {
    const result = await prisma.client.updateMany({
      where: { id, active: 0 },
      data: { active: 1 },
    });
    return result.count > 0;
  }

  public async updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<boolean> {
    const result = await prisma.client.updateMany({
      where: { email, active: 1 },
      data: { password: passwordHash },
    });
    return result.count > 0;
  }
}
