import { prisma } from '../shared/db/connection.js';

export interface BookingData {
  id?: number;
  clientId?: number;
  tripId?: number;
  numSeats?: number;
  state?: string;
}

const BOOKING_INCLUDE = {
  client: { select: { id: true, firstName: true, lastName: true, email: true } },
  trip: {
    include: {
      journey: {
        include: {
          origin: { select: { id: true, name: true } },
          destination: { select: { id: true, name: true } },
        },
      },
      vehicle: { select: { id: true, maxCapacity: true } },
      driver: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;

export class BookingRepository {
  public async findAll() {
    return prisma.booking.findMany({
      include: BOOKING_INCLUDE,
      orderBy: { id: 'desc' },
    });
  }

  public async findOne(item: { id: number }) {
    return prisma.booking.findUnique({
      where: { id: item.id },
      include: BOOKING_INCLUDE,
    });
  }

  // Sum of already-reserved seats for a trip, excluding a given reservation
  // (used to enforce vehicle capacity).
  public async sumSeatsByTrip(tripId: number, excludeId?: number) {
    const rows = await prisma.booking.aggregate({
      where: { tripId, ...(excludeId ? { id: { not: excludeId } } : {}) },
      _sum: { numSeats: true },
    });
    return rows._sum.numSeats ?? 0;
  }

  public async add(item: BookingData) {
    return prisma.booking.create({
      data: {
        clientId: item.clientId!,
        tripId: item.tripId!,
        numSeats: item.numSeats ?? 1,
        state: item.state ?? 'pending',
      },
      include: BOOKING_INCLUDE,
    });
  }

  public async update(item: BookingData) {
    if (item.id === undefined) {
      return undefined;
    }
    const data: Record<string, unknown> = {};
    if (item.clientId !== undefined) data.clientId = item.clientId;
    if (item.tripId !== undefined) data.tripId = item.tripId;
    if (item.numSeats !== undefined) data.numSeats = item.numSeats;
    if (item.state !== undefined) data.state = item.state;

    if (Object.keys(data).length === 0) {
      return undefined;
    }
    return prisma.booking.update({
      where: { id: item.id },
      data,
      include: BOOKING_INCLUDE,
    });
  }

  public async delete(item: { id: number }) {
    return prisma.booking.delete({ where: { id: item.id } });
  }
}
