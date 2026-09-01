import { Request, Response } from 'express';
import { TripRepository } from './trip.repository.js';
import { JourneyRepository } from '../journey/journey.repository.js';
import { DriverRepository } from '../driver/driver.repository.js';
import { VehicleRepository } from '../vehicle/vehicle.repository.js';

const repository = new TripRepository();
const journeyRepository = new JourneyRepository();
const driverRepository = new DriverRepository();
const vehicleRepository = new VehicleRepository();

async function validateDependencies(journeyId: number, driverId: number, vehicleId: number) {
  const journey = await journeyRepository.findOne({ id: journeyId });
  if (!journey) {
    return 'El trayecto seleccionado no existe';
  }
  const driver = await driverRepository.findOne({ id: driverId });
  if (!driver) {
    return 'El conductor seleccionado no existe';
  }
  const vehicle = await vehicleRepository.findOne({ id: vehicleId });
  if (!vehicle) {
    return 'El vehiculo seleccionado no existe';
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const trip = await repository.findOne({ id });
  if (trip) {
    res.json(trip);
  } else {
    res.status(404).json({ error: 'Viaje no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { journeyId, driverId, vehicleId, departureDate, arrivalDate } =
    req.body.sanitizeInput;

  if (
    journeyId === undefined ||
    journeyId === null ||
    driverId === undefined ||
    driverId === null ||
    vehicleId === undefined ||
    vehicleId === null
  ) {
    res.status(400).json({
      error: 'Debe indicar trayecto, conductor y vehiculo',
    });
    return;
  }

  const departure = toDate(departureDate);
  if (!departure) {
    res.status(400).json({ error: 'La fecha de salida es obligatoria' });
    return;
  }
  const arrival = toDate(arrivalDate);
  if (arrival && arrival <= departure) {
    res.status(400).json({
      error: 'La fecha de llegada debe ser posterior a la de salida',
    });
    return;
  }

  const dependencyError = await validateDependencies(
    Number(journeyId),
    Number(driverId),
    Number(vehicleId)
  );
  if (dependencyError) {
    res.status(400).json({ error: dependencyError });
    return;
  }

  const newTrip = await repository.add({
    journeyId: Number(journeyId),
    driverId: Number(driverId),
    vehicleId: Number(vehicleId),
    departureDate: departure,
    arrivalDate: arrival,
  });
  res.status(201).json(newTrip);
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { journeyId, driverId, vehicleId, departureDate, arrivalDate } =
    req.body.sanitizeInput;

  if (
    (journeyId !== undefined && journeyId !== null) ||
    (driverId !== undefined && driverId !== null) ||
    (vehicleId !== undefined && vehicleId !== null)
  ) {
    const current = await repository.findOne({ id });
    if (!current) {
      res.status(404).json({ error: 'Viaje no encontrado' });
      return;
    }
    const jId = journeyId !== undefined ? Number(journeyId) : current.journeyId;
    const dId = driverId !== undefined ? Number(driverId) : current.driverId;
    const vId = vehicleId !== undefined ? Number(vehicleId) : current.vehicleId;
    const dependencyError = await validateDependencies(jId, dId, vId);
    if (dependencyError) {
      res.status(400).json({ error: dependencyError });
      return;
    }
  }

  const departure = departureDate === undefined ? undefined : toDate(departureDate);
  const arrival = arrivalDate === undefined ? undefined : toDate(arrivalDate);
  if (departure === null && departureDate !== undefined && departureDate !== '' && departureDate !== null) {
    res.status(400).json({ error: 'La fecha de salida es invalida' });
    return;
  }
  if (departure !== undefined && departure !== null && arrival !== undefined && arrival !== null && arrival <= departure) {
    res.status(400).json({
      error: 'La fecha de llegada debe ser posterior a la de salida',
    });
    return;
  }

  const updatedTrip = await repository.update({
    id,
    journeyId: journeyId !== undefined ? Number(journeyId) : undefined,
    driverId: driverId !== undefined ? Number(driverId) : undefined,
    vehicleId: vehicleId !== undefined ? Number(vehicleId) : undefined,
    departureDate: departure === null ? undefined : departure,
    arrivalDate: arrival === null ? undefined : arrival,
  });
  if (updatedTrip) {
    res.status(200).json(updatedTrip);
  } else {
    res.status(404).json({ error: 'Viaje no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedTrip = await repository.delete({ id });
    if (deletedTrip) {
      res.json({ message: 'Viaje eliminado' });
    } else {
      res.status(404).json({ error: 'Viaje no encontrado' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Viaje no encontrado' });
      return;
    }
    if (err?.code === 'P2003') {
      res.status(409).json({
        error: 'No se puede eliminar el viaje porque tiene reservas asociadas',
      });
      return;
    }
    throw err;
  }
}

export { findAll, findOne, add, update, remove };