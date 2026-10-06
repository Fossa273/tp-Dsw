import { prisma } from '../shared/db/connection.js';

export interface BookingData {
  id?: number;
  clientId?: number | null;
  tripId?: number;
  numSeats?: number;
  state?: string;
  price?: number;
  passengerFirstName?: string;
  passengerLastName?: string;
  passengerDni?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  passengers?: Array<{
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
  }>;
}

const BOOKING_INCLUDE = {
  client: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  trip: {
    include: {
      journey: {
        include: {
          origin: { select: { id: true, name: true } },
          destination: { select: { id: true, name: true } },
        },
      },
      vehicle: {
        select: { id: true, maxCapacity: true, categoryRelation: true },
      },
      driver: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  passengers: { orderBy: { id: 'asc' as const } },
} as const;

function passengerCreateData(passengers: BookingData['passengers']) {
  return passengers?.length
    ? {
        create: passengers.map((passenger) => ({
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          dni: passenger.dni,
          phone: passenger.phone,
          email: passenger.email,
        })),
      }
    : undefined;
}

export class BookingRepository {
  public async findAll(clientId?: number) {
    return prisma.booking.findMany({
      where: clientId === undefined ? undefined : { clientId },
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
  // (used to enforce vehicle capacity). Cancelled reservations do not count.
  public async sumSeatsByTrip(tripId: number, excludeId?: number) {
    const rows = await prisma.booking.aggregate({
      where: {
        tripId,
        state: { not: 'cancelled' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      _sum: { numSeats: true },
    });
    return rows._sum.numSeats ?? 0;
  }

  public async add(item: BookingData) {
    return prisma.booking.create({
      data: {
        clientId: item.clientId ?? null,
        tripId: item.tripId!,
        numSeats: item.numSeats ?? 1,
        state: item.state ?? 'pending',
        price: item.price ?? 0,
        passengerFirstName: item.passengerFirstName,
        passengerLastName: item.passengerLastName,
        passengerDni: item.passengerDni,
        passengerPhone: item.passengerPhone,
        passengerEmail: item.passengerEmail,
        passengers: passengerCreateData(item.passengers),
      },
      include: BOOKING_INCLUDE,
    });
  }

  public async addWithCapacity(item: BookingData, capacity: number) {
    return prisma.$transaction(async (transaction) => {
      const rows = await transaction.booking.aggregate({
        where: {
          tripId: item.tripId!,
          state: { not: 'cancelled' },
        },
        _sum: { numSeats: true },
      });
      const usedSeats = rows._sum.numSeats ?? 0;
      const requestedSeats = item.numSeats ?? 1;
      if (usedSeats + requestedSeats > capacity) {
        throw new Error(
          `El viaje no tiene suficientes asientos disponibles (capacidad ${capacity}, asientos ya reservados ${usedSeats})`
        );
      }

      return transaction.booking.create({
        data: {
          clientId: item.clientId ?? null,
          tripId: item.tripId!,
          numSeats: requestedSeats,
          state: item.state ?? 'pending',
          price: item.price ?? 0,
          passengerFirstName: item.passengerFirstName,
          passengerLastName: item.passengerLastName,
          passengerDni: item.passengerDni,
          passengerPhone: item.passengerPhone,
          passengerEmail: item.passengerEmail,
          passengers: passengerCreateData(item.passengers),
        },
        include: BOOKING_INCLUDE,
      });
    }, { isolationLevel: 'Serializable' });
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
    if (item.price !== undefined) data.price = item.price;
    if (item.passengerFirstName !== undefined) data.passengerFirstName = item.passengerFirstName;
    if (item.passengerLastName !== undefined) data.passengerLastName = item.passengerLastName;
    if (item.passengerDni !== undefined) data.passengerDni = item.passengerDni;
    if (item.passengerPhone !== undefined) data.passengerPhone = item.passengerPhone;
    if (item.passengerEmail !== undefined) data.passengerEmail = item.passengerEmail;

    if (Object.keys(data).length === 0) {
      return prisma.booking.findUnique({
        where: { id: item.id },
        include: BOOKING_INCLUDE,
      });
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

  public async seatsByTripIds(tripIds: number[]) {
    const rows = await prisma.booking.groupBy({
      by: ['tripId'],
      where: {
        tripId: { in: tripIds },
        state: { not: 'cancelled' },
      },
      _sum: { numSeats: true },
    });
    const map: Record<number, number> = {};
    for (const row of rows) {
      map[row.tripId] = row._sum.numSeats ?? 0;
    }
    return map;
  }
}
