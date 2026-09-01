import { prisma } from '../shared/db/connection.js';

export interface TripData {
  id?: number;
  journeyId?: number;
  driverId?: number;
  vehicleId?: number;
  departureDate?: Date;
  arrivalDate?: Date | null;
}

const TRIP_INCLUDE = {
  journey: {
    include: {
      origin: { select: { id: true, name: true } },
      destination: { select: { id: true, name: true } },
    },
  },
  driver: { select: { id: true, firstName: true, lastName: true, active: true } },
  vehicle: { select: { id: true, maxCapacity: true } },
} as const;

export class TripRepository {
  public async findAll() {
    return prisma.trip.findMany({
      include: TRIP_INCLUDE,
      orderBy: { departureDate: 'asc' },
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
        departureDate: item.departureDate!,
        arrivalDate: item.arrivalDate ?? null,
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
    if (item.departureDate !== undefined) data.departureDate = item.departureDate;
    if (item.arrivalDate !== undefined) data.arrivalDate = item.arrivalDate;

    if (Object.keys(data).length === 0) {
      return prisma.trip.findUnique({ where: { id: item.id }, include: TRIP_INCLUDE });
    }
    return prisma.trip.update({
      where: { id: item.id },
      data,
      include: TRIP_INCLUDE,
    });
  }

  public async delete(item: { id: number }) {
    return prisma.trip.delete({ where: { id: item.id } });
  }
}
