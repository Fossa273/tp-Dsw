import { prisma } from '../shared/db/connection.js';

export interface TripData {
  id?: number;
  journeyId?: number;
  driverId?: number;
  vehicleId?: number;
  dayOfWeek?: number;
  departureTime?: string;
  arrivalTime?: string;
  arrivesNextDay?: boolean;
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
  vehicle: { select: { id: true, maxCapacity: true } },
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
    return prisma.trip.findUnique({
      where: { id: item.id },
      include: TRIP_INCLUDE,
    });
  }

  public async add(item: TripData) {
    return prisma.trip.create({
      data: {
        journeyId: item.journeyId!,
        driverId: item.driverId!,
        vehicleId: item.vehicleId!,
        dayOfWeek: item.dayOfWeek!,
        departureTime: item.departureTime!,
        arrivalTime: item.arrivalTime ?? null,
        arrivesNextDay: item.arrivesNextDay ?? false,
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
    if (item.dayOfWeek !== undefined) data.dayOfWeek = item.dayOfWeek;
    if (item.departureTime !== undefined) data.departureTime = item.departureTime;
    if (item.arrivalTime !== undefined) data.arrivalTime = item.arrivalTime;
    if (item.arrivesNextDay !== undefined) data.arrivesNextDay = item.arrivesNextDay;

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
}