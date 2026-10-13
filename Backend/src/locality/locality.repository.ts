import { prisma } from '../shared/db/connection.js';

export interface LocalityData {
  id?: number;
  name?: string;
  provinceId?: number | null;
}

const LOCATION_SELECT = {
  id: true,
  name: true,
  province: {
    select: { id: true, name: true, abbreviation: true },
  },
} as const;

export class LocalityRepository {
  public async findAll() {
    return prisma.locality.findMany({
      select: LOCATION_SELECT,
    });
  }

  public async paginated(page: number, limit: number, search = '', sort = 'name', order: 'asc' | 'desc' = 'asc', provinceId?: number) {
    const term = search.trim();
    const where = {
      ...(term ? { name: { contains: term } } : {}),
      ...(provinceId ? { provinceId } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.locality.findMany({ where, select: LOCATION_SELECT, orderBy: sort === 'id' ? { id: order } : { name: order }, skip: (page - 1) * limit, take: limit }),
      prisma.locality.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async findOne(item: { id: number }) {
    return prisma.locality.findUnique({
      where: { id: item.id },
      select: LOCATION_SELECT,
    });
  }

  // A locality name may exist in different provinces. It is only a duplicate
  // when both its name and province match.
  public async findByNameAndProvince(name: string, provinceId: number | null, excludeId?: number) {
    return prisma.locality.findFirst({
      where: {
        name,
        provinceId,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
  }

  public async add(item: LocalityData) {
    return prisma.locality.create({
      data: {
        name: item.name ?? null,
        provinceId: item.provinceId ?? null,
      },
      select: LOCATION_SELECT,
    });
  }

  public async update(item: LocalityData) {
    if (item.id === undefined) {
      return undefined;
    }
    const data: Record<string, unknown> = {};
    if (item.name !== undefined) data.name = item.name;
    if (item.provinceId !== undefined) data.provinceId = item.provinceId;

    if (Object.keys(data).length === 0) {
      return prisma.locality.findUnique({
        where: { id: item.id },
        select: LOCATION_SELECT,
      });
    }
    return prisma.locality.update({
      where: { id: item.id },
      data: data as any,
      select: LOCATION_SELECT,
    });
  }

  public async delete(item: { id: number }) {
    return prisma.locality.delete({ where: { id: item.id } });
  }
}