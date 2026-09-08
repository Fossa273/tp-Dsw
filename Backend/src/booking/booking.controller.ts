import { Request, Response } from 'express';
import { BookingRepository } from './booking.repository.js';
import { ClientRepository } from '../client/client.repository.js';
import { TripRepository } from '../trip/trip.repository.js';

const repository = new BookingRepository();
const clientRepository = new ClientRepository();
const tripRepository = new TripRepository();

const VALID_STATES = ['pending', 'confirmed', 'cancelled'];
const FUEL_PRICE_PER_KM = Number(process.env.FUEL_PRICE_PER_KM ?? 100);
const OPERATING_COST_MULTIPLIER = 1.4;
const MAX_BOOKING_ADVANCE_MONTHS = 1;

async function calculatePrice(tripId: number, seats: number) {
  const trip = await tripRepository.findOne({ id: tripId });
  if (!trip || !trip.vehicle?.categoryRelation) return null;
  const capacity = trip.vehicle.maxCapacity;
  if (!Number.isFinite(capacity) || capacity <= 0) return null;

  const fuelCost = trip.journey.distanceKm * FUEL_PRICE_PER_KM;
  const fuelCostPerSeat = (fuelCost * OPERATING_COST_MULTIPLIER) / capacity;
  const pricePerSeat =
    fuelCostPerSeat + trip.vehicle.categoryRelation.precioBase;
  return Number((pricePerSeat * seats).toFixed(2));
}

function normalizeNumSeats(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
}

function nextWeeklyDeparture(dayOfWeek: number, departureTime: string) {
  const now = new Date();
  const [hours, minutes] = departureTime.split(':').map(Number);
  const departure = new Date(now);
  departure.setHours(hours, minutes, 0, 0);
  const daysUntilDeparture = (dayOfWeek - now.getDay() + 7) % 7;
  departure.setDate(now.getDate() + daysUntilDeparture);
  if (departure <= now) {
    departure.setDate(departure.getDate() + 7);
  }
  return departure;
}

async function validateBookingWindow(tripId: number) {
  const trip = await tripRepository.findOne({ id: tripId });
  if (!trip) {
    return 'El viaje seleccionado no existe';
  }

  const departure =
    trip.scheduleType === 'specific' && trip.departureDate
      ? trip.departureDate
      : nextWeeklyDeparture(trip.dayOfWeek, trip.departureTime);
  const maximumAdvanceDate = new Date();
  maximumAdvanceDate.setMonth(
    maximumAdvanceDate.getMonth() + MAX_BOOKING_ADVANCE_MONTHS
  );

  if (departure <= new Date()) {
    return 'No se puede reservar un viaje que ya paso';
  }
  if (departure > maximumAdvanceDate) {
    return 'Las reservas solo pueden hacerse hasta un mes antes del viaje';
  }
  return null;
}

async function validateCancellationWindow(tripId: number) {
  const trip = await tripRepository.findOne({ id: tripId });
  if (!trip) return 'El viaje seleccionado no existe';

  const departure =
    trip.scheduleType === 'specific' && trip.departureDate
      ? trip.departureDate
      : nextWeeklyDeparture(trip.dayOfWeek, trip.departureTime);
  const tripEnd = new Date(
    departure.getTime() + trip.journey.durationMinutes * 60_000
  );
  return tripEnd <= new Date()
    ? 'La reserva no puede cancelarse porque el viaje ya finalizo'
    : null;
}

// Checks that the capacity of the trip's vehicle is not exceeded taking into
// account the seats already reserved. Returns an error message or null.
async function validateCapacity(
  tripId: number,
  numSeats: number,
  excludeBookingId?: number
) {
  const trip = await tripRepository.findOne({ id: tripId });
  if (!trip) {
    return 'El viaje seleccionado no existe';
  }
  const capacity = trip.vehicle?.maxCapacity ?? 0;
  try {
    const usedSeats = await repository.sumSeatsByTrip(tripId, excludeBookingId);
    if (usedSeats + numSeats > capacity) {
      return `El viaje no tiene suficientes asientos disponibles (capacidad ${capacity}, asientos ya reservados ${usedSeats})`;
    }
  } catch {
    // FK violation inside the aggregate means the trip does not exist.
    return 'El viaje seleccionado no existe';
  }
  return null;
}

async function findAll(req: Request, res: Response) {
  const clientId =
    req.query.clientId === undefined ? undefined : Number(req.query.clientId);
  res.json({
    data: await repository.findAll(
      Number.isInteger(clientId) ? clientId : undefined
    ),
  });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const booking = await repository.findOne({ id });
  if (booking) {
    res.json(booking);
  } else {
    res.status(404).json({ error: 'Reserva no encontrada' });
  }
}

async function add(req: Request, res: Response) {
  const { clientId, tripId, numSeats, state } = req.body.sanitizeInput;

  if (clientId === undefined || clientId === null) {
    res.status(400).json({ error: 'El cliente es obligatorio' });
    return;
  }
  if (tripId === undefined || tripId === null) {
    res.status(400).json({ error: 'El viaje es obligatorio' });
    return;
  }
  const seats = normalizeNumSeats(numSeats);
  if (seats === null) {
    res
      .status(400)
      .json({ error: 'La cantidad de asientos debe ser un entero mayor a 0' });
    return;
  }
  if (state !== undefined && !VALID_STATES.includes(state.toLowerCase())) {
    res
      .status(400)
      .json({ error: 'El estado debe ser pending, confirmed o cancelled' });
    return;
  }

  const client = await clientRepository.findOne({ id: Number(clientId) });
  if (!client) {
    res.status(400).json({ error: 'El cliente seleccionado no existe' });
    return;
  }

  const bookingWindowError = await validateBookingWindow(Number(tripId));
  if (bookingWindowError) {
    res.status(400).json({ error: bookingWindowError });
    return;
  }

  const capacityError = await validateCapacity(Number(tripId), seats);
  if (capacityError) {
    res.status(400).json({ error: capacityError });
    return;
  }
  const price = await calculatePrice(Number(tripId), seats);
  if (price === null) {
    res.status(400).json({
      error: 'El vehiculo no tiene una categoria con precio base asignado',
    });
    return;
  }

  const newBooking = await repository.add({
    clientId: Number(clientId),
    tripId: Number(tripId),
    numSeats: seats,
    state: state ? state.toLowerCase() : 'pending',
    price,
  });
  res.status(201).json(newBooking);
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { clientId, tripId, numSeats, state } = req.body.sanitizeInput;
  const changesTripOrSeats =
    (tripId !== undefined && tripId !== null) ||
    (numSeats !== undefined && numSeats !== null);
  const existingBooking = changesTripOrSeats
    ? await repository.findOne({ id })
    : null;

  if (changesTripOrSeats && !existingBooking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }

  if (state !== undefined && !VALID_STATES.includes(state.toLowerCase())) {
    res
      .status(400)
      .json({ error: 'El estado debe ser pending, confirmed o cancelled' });
    return;
  }
  if (clientId !== undefined && clientId !== null) {
    const client = await clientRepository.findOne({ id: Number(clientId) });
    if (!client) {
      res.status(400).json({ error: 'El cliente seleccionado no existe' });
      return;
    }
  }

  if (tripId !== undefined && tripId !== null) {
    const bookingWindowError = await validateBookingWindow(Number(tripId));
    if (bookingWindowError) {
      res.status(400).json({ error: bookingWindowError });
      return;
    }
    const seats =
      numSeats === undefined ? undefined : normalizeNumSeats(numSeats);
    if (seats === null && numSeats !== undefined) {
      res.status(400).json({
        error: 'La cantidad de asientos debe ser un entero mayor a 0',
      });
      return;
    }
    const seatsForCheck: number = seats ?? existingBooking?.numSeats ?? 1;
    const capacityError = await validateCapacity(
      Number(tripId),
      seatsForCheck,
      id
    );
    if (capacityError) {
      res.status(400).json({ error: capacityError });
      return;
    }
  } else if (numSeats !== undefined && numSeats !== null) {
    const seats = normalizeNumSeats(numSeats);
    if (seats === null) {
      res.status(400).json({
        error: 'La cantidad de asientos debe ser un entero mayor a 0',
      });
      return;
    }
    const currentTripId = existingBooking?.tripId;
    if (currentTripId !== undefined) {
      const capacityError = await validateCapacity(currentTripId, seats, id);
      if (capacityError) {
        res.status(400).json({ error: capacityError });
        return;
      }
    }
  }

  const updatedBooking = await repository.update({
    id,
    clientId: clientId !== undefined ? Number(clientId) : undefined,
    tripId: tripId !== undefined ? Number(tripId) : undefined,
    numSeats:
      numSeats === undefined
        ? undefined
        : (normalizeNumSeats(numSeats) ?? undefined),
    state: state === undefined ? undefined : String(state).toLowerCase(),
  });
  if (updatedBooking) {
    res.status(200).json(updatedBooking);
  } else {
    res.status(404).json({ error: 'Reserva no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedBooking = await repository.delete({ id });
    if (deletedBooking) {
      res.json({ message: 'Reserva eliminada' });
    } else {
      res.status(404).json({ error: 'Reserva no encontrada' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }
    throw err;
  }
}

async function cancel(req: Request, res: Response) {
  const id = Number(req.params.id);
  const clientId = Number(req.body?.clientId);
  const booking = await repository.findOne({ id });

  if (!booking) {
    res.status(404).json({ error: 'Reserva no encontrada' });
    return;
  }
  if (!Number.isInteger(clientId) || booking.clientId !== clientId) {
    res
      .status(403)
      .json({ error: 'No puede cancelar una reserva de otro cliente' });
    return;
  }
  if (booking.state === 'cancelled') {
    res.status(400).json({ error: 'La reserva ya esta cancelada' });
    return;
  }

  const cancellationError = await validateCancellationWindow(booking.tripId);
  if (cancellationError) {
    res.status(400).json({ error: cancellationError });
    return;
  }

  const updatedBooking = await repository.update({ id, state: 'cancelled' });
  res.json(updatedBooking);
}

export { findAll, findOne, add, update, remove, cancel };
