import { Request, Response } from 'express';
import { BookingRepository } from './booking.repository.js';
import { ClientRepository } from '../client/client.repository.js';
import { TripRepository } from '../trip/trip.repository.js';

const repository = new BookingRepository();
const clientRepository = new ClientRepository();
const tripRepository = new TripRepository();

const VALID_STATES = ['pending', 'confirmed', 'cancelled'];

function normalizeNumSeats(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
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
    const usedSeats = await repository.sumSeatsByTrip(
      tripId,
      excludeBookingId
    );
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
  res.json({ data: await repository.findAll() });
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
    res.status(400).json({ error: 'La cantidad de asientos debe ser un entero mayor a 0' });
    return;
  }
  if (state !== undefined && !VALID_STATES.includes(state.toLowerCase())) {
    res.status(400).json({ error: 'El estado debe ser pending, confirmed o cancelled' });
    return;
  }

  const client = await clientRepository.findOne({ id: Number(clientId) });
  if (!client) {
    res.status(400).json({ error: 'El cliente seleccionado no existe' });
    return;
  }

  const capacityError = await validateCapacity(Number(tripId), seats);
  if (capacityError) {
    res.status(400).json({ error: capacityError });
    return;
  }

  const newBooking = await repository.add({
    clientId: Number(clientId),
    tripId: Number(tripId),
    numSeats: seats,
    state: state ? state.toLowerCase() : 'pending',
  });
  res.status(201).json(newBooking);
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { clientId, tripId, numSeats, state } = req.body.sanitizeInput;

  if (state !== undefined && !VALID_STATES.includes(state.toLowerCase())) {
    res.status(400).json({ error: 'El estado debe ser pending, confirmed o cancelled' });
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
    const seats = numSeats === undefined ? undefined : normalizeNumSeats(numSeats);
    if (seats === null && numSeats !== undefined) {
      res.status(400).json({ error: 'La cantidad de asientos debe ser un entero mayor a 0' });
      return;
    }
    const existing = seats === undefined ? await repository.findOne({ id }) : null;
    const seatsForCheck: number = seats ?? existing?.numSeats ?? 1;
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
      res.status(400).json({ error: 'La cantidad de asientos debe ser un entero mayor a 0' });
      return;
    }
    const currentBooking = await repository.findOne({ id });
    const currentTripId = currentBooking?.tripId;
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
      numSeats === undefined ? undefined : normalizeNumSeats(numSeats) ?? undefined,
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

export { findAll, findOne, add, update, remove };