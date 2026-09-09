import { prisma } from '../shared/db/connection.js';

export interface TripData {
  id?: number;
  journeyId?: number;
  driverId?: number;
  vehicleId?: number;
  scheduleType?: string;
  dayOfWeek?: number;
  departureTime?: string;
  arrivalTime?: string;
  departureDate?: Date | null;
  arrivalDate?: Date | null;
  arrivesNextDay?: boolean;
  isPromoted?: number;
  promoExpiry?: Date | null;
  active?: number;
}

const TRIP_INCLUDE = {
  journey: {
    include: {
      origin: {
        select: {
          id: true,
          name: true,
          province: { select: { id: true, name: true, abbreviation: true } },
        },
      },
      destination: {
        select: {
          id: true,
          name: true,
          province: { select: { id: true, name: true, abbreviation: true } },
        },
      },
    },
  },
  driver: {
    select: { id: true, firstName: true, lastName: true, active: true },
  },
  vehicle: { select: { id: true, maxCapacity: true, categoryRelation: true, hasBathroom: true, maintenance: true } },
} as const;

export class TripRepository {
  // Active trips, recurring weekly schedule sorted by day, then departure time.
  public async findAll() {
    return prisma.trip.findMany({
      where: { active: 1 },
      include: TRIP_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { departureTime: 'asc' }],
    });
  }

  // Logically-deleted (hidden) trips.
  public async findAllInactive() {
    return prisma.trip.findMany({
      where: { active: 0 },
      include: TRIP_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { departureTime: 'asc' }],
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.trip.findFirst({
      where: { id: item.id, active: 1 },
      include: TRIP_INCLUDE,
    });
  }

  public async findOneIncludingInactive(item: { id: number }) {
    return prisma.trip.findUnique({
      where: { id: item.id },
      include: TRIP_INCLUDE,
    });
  }

  public async findActiveByResources(driverId: number, vehicleId: number) {
    return prisma.trip.findMany({
      where: {
        active: 1,
        OR: [{ driverId }, { vehicleId }],
      },
      select: {
        id: true,
        driverId: true,
        vehicleId: true,
        scheduleType: true,
        dayOfWeek: true,
        departureTime: true,
        arrivalTime: true,
        departureDate: true,
        arrivalDate: true,
        arrivesNextDay: true,
      },
    });
  }

  public async add(item: TripData) {
    return prisma.trip.create({
      data: {
        journeyId: item.journeyId!,
        driverId: item.driverId!,
        vehicleId: item.vehicleId!,
        scheduleType: item.scheduleType ?? 'weekly',
        dayOfWeek: item.dayOfWeek!,
        departureTime: item.departureTime!,
        arrivalTime: item.arrivalTime ?? null,
        departureDate: item.departureDate ?? null,
        arrivalDate: item.arrivalDate ?? null,
        arrivesNextDay: item.arrivesNextDay ?? false,
        isPromoted: item.isPromoted ?? 0,
        promoExpiry: item.promoExpiry ?? null,
        active: 1,
      },
      include: TRIP_INCLUDE,
    });
  }

  public async update(item: TripData) {
    if (item.id === undefined) {
      return undefined;
    }
    const data: Record<string, unknown> = {};
    if (item.journeyId !== undefined) data.journeyId = item.journeyId;
    if (item.driverId !== undefined) data.driverId = item.driverId;
    if (item.vehicleId !== undefined) data.vehicleId = item.vehicleId;
    if (item.scheduleType !== undefined) data.scheduleType = item.scheduleType;
    if (item.dayOfWeek !== undefined) data.dayOfWeek = item.dayOfWeek;
    if (item.departureTime !== undefined) data.departureTime = item.departureTime;
    if (item.arrivalTime !== undefined) data.arrivalTime = item.arrivalTime;
    if (item.departureDate !== undefined) data.departureDate = item.departureDate;
    if (item.arrivalDate !== undefined) data.arrivalDate = item.arrivalDate;
    if (item.arrivesNextDay !== undefined) data.arrivesNextDay = item.arrivesNextDay;
    if (item.isPromoted !== undefined) data.isPromoted = item.isPromoted;
    if (item.promoExpiry !== undefined) data.promoExpiry = item.promoExpiry;

    if (Object.keys(data).length === 0) {
      return prisma.trip.findUnique({
        where: { id: item.id },
        include: TRIP_INCLUDE,
      });
    }
    return prisma.trip.update({
      where: { id: item.id },
      data,
      include: TRIP_INCLUDE,
    });
  }

  // Logical deletion: trips that already have bookings keep their history.
  public async deactivate(item: { id: number }) {
    return prisma.trip.update({
      where: { id: item.id },
      data: { active: 0 },
    });
  }

  public async reactivate(item: { id: number }) {
    return prisma.trip.update({
      where: { id: item.id },
      data: { active: 1 },
    });
  }

  public async findPromoted() {
    return prisma.trip.findMany({
      where: {
        active: 1,
        isPromoted: 1,
        OR: [
          { promoExpiry: null },
          { promoExpiry: { gt: new Date() } },
        ],
      },
      include: TRIP_INCLUDE,
      orderBy: [{ departureTime: 'asc' }],
    });
  }

  public async paginated(page: number, limit: number, clientId?: number) {
    const skip = (page - 1) * limit;
    const where = clientId !== undefined ? { clientId } : {};
    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where: { active: 1, ...where },
        include: TRIP_INCLUDE,
        orderBy: [{ dayOfWeek: 'asc' }, { departureTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.trip.count({ where: { active: 1, ...where } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}