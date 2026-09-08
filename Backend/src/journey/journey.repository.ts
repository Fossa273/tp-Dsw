import { prisma } from '../shared/db/connection.js';

export interface JourneyData {
  id?: number;
  originId?: number;
  destinationId?: number;
  distanceKm?: number;
  durationMinutes?: number;
}

export class JourneyRepository {
  private readonly journeyInclude = {
    origin: { select: { id: true, name: true, province: { select: { id: true, name: true, abbreviation: true } } } },
    destination: { select: { id: true, name: true, province: { select: { id: true, name: true, abbreviation: true } } } },
  } as const;

  public async findAll() {
    return prisma.journey.findMany({
      where: { active: 1 },
      include: this.journeyInclude,
      orderBy: { id: 'asc' },
    });
  }

  public async findAllInactive() {
    return prisma.journey.findMany({
      where: { active: 0 },
      include: this.journeyInclude,
      orderBy: { id: 'asc' },
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.journey.findUnique({
      where: { id: item.id },
      include: this.journeyInclude,
    });
  }

  // A journey is identified by its origin+destination pair.
  public async findByJourney(originId: number, destinationId: number) {
    return prisma.journey.findFirst({
      where: { originId, destinationId, active: 1 },
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
      include: this.journeyInclude,
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

  public async deactivate(item: { id: number }) {
    return prisma.$transaction(async (transaction) => {
      const activeTrips = await transaction.trip.count({
        where: { journeyId: item.id, active: 1 },
      });
      if (activeTrips > 0) {
        const error = new Error('El trayecto tiene viajes activos');
        (error as Error & { code?: string }).code = 'ACTIVE_TRIPS';
        throw error;
      }

      return transaction.journey.update({
        where: { id: item.id },
        data: { active: 0 },
      });
    });
  }

  public async reactivate(item: { id: number }) {
    const result = await prisma.journey.updateMany({
      where: { id: item.id, active: 0 },
      data: { active: 1 },
    });
    return result.count > 0;
  }
}