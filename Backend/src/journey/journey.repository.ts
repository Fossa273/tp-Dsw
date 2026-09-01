import { prisma } from '../shared/db/connection.js';

export interface JourneyData {
  id?: number;
  originId?: number;
  destinationId?: number;
  distanceKm?: number;
  durationMinutes?: number;
}

export class JourneyRepository {
  public async findAll() {
    return prisma.journey.findMany({
      include: {
        origin: { select: { id: true, name: true } },
        destination: { select: { id: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.journey.findUnique({
      where: { id: item.id },
      include: {
        origin: { select: { id: true, name: true } },
        destination: { select: { id: true, name: true } },
      },
    });
  }

  // A journey is identified by its origin+destination pair.
  public async findByJourney(originId: number, destinationId: number) {
    return prisma.journey.findFirst({
      where: { originId, destinationId },
    });
  }

  public async add(item: JourneyData) {
    return prisma.journey.create({
      data: {
        originId: item.originId!,
        destinationId: item.destinationId!,
        distanceKm: item.distanceKm ?? 0,
        durationMinutes: item.durationMinutes ?? 0,
      },
      include: {
        origin: { select: { id: true, name: true } },
        destination: { select: { id: true, name: true } },
      },
    });
  }

  public async update(item: JourneyData) {
    if (item.id === undefined) {
      return undefined;
    }
    return prisma.journey.update({
      where: { id: item.id },
      data: {
        originId: item.originId,
        destinationId: item.destinationId,
        distanceKm: item.distanceKm,
        durationMinutes: item.durationMinutes,
      },
      include: {
        origin: { select: { id: true, name: true } },
        destination: { select: { id: true, name: true } },
      },
    });
  }

  public async delete(item: { id: number }) {
    return prisma.journey.delete({ where: { id: item.id } });
  }
}