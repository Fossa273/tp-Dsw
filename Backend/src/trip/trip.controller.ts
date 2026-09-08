import { Request, Response } from 'express';
import { TripRepository } from './trip.repository.js';
import { TripData } from './trip.repository.js';
import { JourneyRepository } from '../journey/journey.repository.js';
import { DriverRepository } from '../driver/driver.repository.js';
import { VehicleRepository } from '../vehicle/vehicle.repository.js';

const repository = new TripRepository();
const journeyRepository = new JourneyRepository();
const driverRepository = new DriverRepository();
const vehicleRepository = new VehicleRepository();

async function validateDependencies(
  journeyId: number,
  driverId: number,
  vehicleId: number
) {
  const journey = await journeyRepository.findOne({ id: journeyId });
  if (!journey) {
    return { error: 'El trayecto seleccionado no existe' };
  }
  const driver = await driverRepository.findOne({ id: driverId });
  if (!driver) {
    return { error: 'El conductor seleccionado no existe' };
  }
  const vehicle = await vehicleRepository.findOne({ id: vehicleId });
  if (!vehicle) {
    return { error: 'El vehiculo seleccionado no existe' };
  }
  if (vehicle.maintenance) {
    return { error: 'El vehiculo seleccionado esta en mantenimiento' };
  }
  return { journey, driver, vehicle };
}

// "HH:MM" -> total minutes, or null when invalid.
function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// departure + duration -> arrivalTime and whether it lands on the next day.
function computeArrival(departureMinutes: number, durationMinutes: number) {
  const total = departureMinutes + durationMinutes;
  return {
    arrivalTime: minutesToTime(total >= 1440 ? total % 1440 : total),
    arrivesNextDay: total >= 1440,
  };
}

const DAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const ROTATION_BUFFER_MINUTES = 10;

function dayOfWeekToNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value >= 0 && value <= 6 ? value : null;
  }
  if (typeof value === 'string') {
    const isNumeric = /^\d+$/.test(value.trim());
    if (isNumeric) {
      const n = Number(value);
      return n >= 0 && n <= 6 ? n : null;
    }
    const byName = DAYS[value.trim().toLowerCase()];
    return byName === undefined ? null : byName;
  }
  return null;
}

type ScheduleInput = {
  scheduleType: string;
  dayOfWeek: number;
  departureMinutes: number;
  departureDate: Date | null;
  durationMinutes: number;
};

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function weeklyIntervals(day: number, start: number, duration: number) {
  const end = start + duration + ROTATION_BUFFER_MINUTES;
  const intervals = [{ day, start, end: Math.min(end, 1440) }];
  if (end > 1440) intervals.push({ day: (day + 1) % 7, start: 0, end: end - 1440 });
  return intervals;
}

function schedulesOverlap(existing: any, candidate: ScheduleInput) {
  if (candidate.scheduleType === 'specific' && existing.scheduleType === 'specific') {
    if (!candidate.departureDate || !existing.departureDate || !existing.arrivalDate) return false;
    return candidate.departureDate < new Date(existing.arrivalDate.getTime() + ROTATION_BUFFER_MINUTES * 60000) &&
      new Date(candidate.departureDate.getTime() + (candidate.durationMinutes + ROTATION_BUFFER_MINUTES) * 60000) > existing.departureDate;
  }

  const existingStart = existing.scheduleType === 'specific'
    ? existing.departureDate.getHours() * 60 + existing.departureDate.getMinutes()
    : parseTime(existing.departureTime)!;
  const existingDay = existing.scheduleType === 'specific'
    ? existing.departureDate.getDay()
    : existing.dayOfWeek;
  const existingDuration = existing.scheduleType === 'specific' && existing.arrivalDate
    ? (existing.arrivalDate.getTime() - existing.departureDate.getTime()) / 60000
    : (() => {
        const end = parseTime(existing.arrivalTime)!;
        return (end - existingStart + (existing.arrivesNextDay ? 1440 : 0)) || 1440;
      })();
  const existingIntervals = weeklyIntervals(existingDay, existingStart, existingDuration);
  const candidateIntervals = candidate.scheduleType === 'specific'
    ? weeklyIntervals(candidate.departureDate!.getDay(), candidate.departureMinutes, candidate.durationMinutes)
    : weeklyIntervals(candidate.dayOfWeek, candidate.departureMinutes, candidate.durationMinutes);
  return existingIntervals.some((a) => candidateIntervals.some((b) =>
    a.day === b.day && intervalsOverlap(a.start, a.end, b.start, b.end)
  ));
}

async function validateResourceAvailability(
  driverId: number,
  vehicleId: number,
  candidate: ScheduleInput,
  excludeId?: number
) {
  const trips = await repository.findActiveByResources(driverId, vehicleId);
  const conflict = trips.find((trip) => trip.id !== excludeId && schedulesOverlap(trip, candidate));
  if (!conflict) return null;
  const sameDriver = conflict.driverId === driverId;
  const sameVehicle = conflict.vehicleId === vehicleId;
  return sameDriver && sameVehicle
    ? 'El conductor y el vehiculo ya estan asignados a otro viaje durante ese horario'
    : sameDriver
      ? 'El conductor ya esta asignado a otro viaje durante ese horario'
      : 'El vehiculo ya esta asignado a otro viaje durante ese horario';
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findAllInactive(req: Request, res: Response) {
  res.json({ data: await repository.findAllInactive() });
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
  const { journeyId, driverId, vehicleId, scheduleType, dayOfWeek, departureTime, departureDate } =
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

  const mode = scheduleType === 'specific' ? 'specific' : 'weekly';
  const parsedDepartureDate = mode === 'specific' ? new Date(departureDate) : null;
  if (mode === 'specific' && (!departureDate || Number.isNaN(parsedDepartureDate!.getTime()))) {
    res.status(400).json({ error: 'Debe indicar una fecha y hora de salida validas' });
    return;
  }
  const day = mode === 'specific' ? parsedDepartureDate!.getDay() : dayOfWeekToNumber(dayOfWeek);
  if (day === null) {
    res.status(400).json({
      error: 'Debe indicar un dia de la semana (0=Domingo ... 6=Sabado)',
    });
    return;
  }

  const departureMinutes = mode === 'specific'
    ? parsedDepartureDate!.getHours() * 60 + parsedDepartureDate!.getMinutes()
    : parseTime(departureTime);
  if (departureMinutes === null) {
    res.status(400).json({
      error: 'La hora de salida es obligatoria (formato HH:MM)',
    });
    return;
  }

  const { error, journey } = await validateDependencies(
    Number(journeyId),
    Number(driverId),
    Number(vehicleId)
  );
  if (error) {
    res.status(400).json({ error });
    return;
  }

  // Arrival is derived from the journey duration (distance / 90 km/h).
  const autoArrival = computeArrival(
    departureMinutes,
    journey!.durationMinutes
  );
  const finalArrivalTime = autoArrival.arrivalTime;
  const finalArrivalDate = mode === 'specific'
    ? new Date(parsedDepartureDate!.getTime() + journey!.durationMinutes * 60_000)
    : null;

  const availabilityError = await validateResourceAvailability(
    Number(driverId),
    Number(vehicleId),
    {
      scheduleType: mode,
      dayOfWeek: day,
      departureMinutes,
      departureDate: parsedDepartureDate,
      durationMinutes: journey!.durationMinutes,
    }
  );
  if (availabilityError) {
    res.status(409).json({ error: availabilityError });
    return;
  }

  const newTrip = await repository.add({
    journeyId: Number(journeyId),
    driverId: Number(driverId),
    vehicleId: Number(vehicleId),
    scheduleType: mode,
    dayOfWeek: day,
    departureTime: minutesToTime(departureMinutes),
    arrivalTime: finalArrivalTime,
    departureDate: parsedDepartureDate,
    arrivalDate: finalArrivalDate,
    arrivesNextDay: autoArrival.arrivesNextDay,
  });
  res.status(201).json(newTrip);
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { journeyId, driverId, vehicleId, scheduleType, dayOfWeek, departureTime, departureDate } =
    req.body.sanitizeInput;

  const current = await repository.findOne({ id });
  if (!current) {
    res.status(404).json({ error: 'Viaje no encontrado' });
    return;
  }

  const finalJourneyId =
    journeyId !== undefined && journeyId !== null
      ? Number(journeyId)
      : current.journeyId;
  const finalDriverId =
    driverId !== undefined && driverId !== null
      ? Number(driverId)
      : current.driverId;
  const finalVehicleId =
    vehicleId !== undefined && vehicleId !== null
      ? Number(vehicleId)
      : current.vehicleId;

  const { error, journey } = await validateDependencies(
    finalJourneyId,
    finalDriverId,
    finalVehicleId
  );
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const mode = scheduleType === undefined
    ? current.scheduleType
    : scheduleType === 'specific' ? 'specific' : 'weekly';
  const parsedDepartureDate = mode === 'specific'
    ? new Date(departureDate ?? current.departureDate ?? '')
    : null;
  if (mode === 'specific' && Number.isNaN(parsedDepartureDate!.getTime())) {
    res.status(400).json({ error: 'Debe indicar una fecha y hora de salida validas' });
    return;
  }
  const day = mode === 'specific'
    ? parsedDepartureDate!.getDay()
    : dayOfWeek === undefined ? null : dayOfWeekToNumber(dayOfWeek);
  if (dayOfWeek !== undefined && day === null) {
    res.status(400).json({
      error: 'El dia de la semana es invalido (0=Domingo ... 6=Sabado)',
    });
    return;
  }

  const departureMinutes = mode === 'specific'
    ? parsedDepartureDate!.getHours() * 60 + parsedDepartureDate!.getMinutes()
    : departureTime === undefined ? null : parseTime(departureTime);
  if (departureTime !== undefined && departureMinutes === null) {
    res.status(400).json({ error: 'La hora de salida es invalida (HH:MM)' });
    return;
  }

  const finalDepartureMinutes =
    departureMinutes !== null
      ? departureMinutes
      : parseTime(current.departureTime)!;

  const journeyChanged = current.journeyId !== finalJourneyId;
  const departureChanged = departureMinutes !== null;

  // Arrival is always derived from departure plus journey duration.
  let finalArrivalTime: string | undefined;
  let finalArrivesNextDay: boolean | undefined;

  if (journeyChanged || departureChanged) {
    const autoArrival = computeArrival(
      finalDepartureMinutes,
      journey!.durationMinutes
    );
    finalArrivalTime = autoArrival.arrivalTime;
    finalArrivesNextDay = autoArrival.arrivesNextDay;
  }

  const data: TripData = { id };
  if (finalJourneyId !== current.journeyId) data.journeyId = finalJourneyId;
  if (finalDriverId !== current.driverId) data.driverId = finalDriverId;
  if (finalVehicleId !== current.vehicleId) data.vehicleId = finalVehicleId;
  if (mode !== current.scheduleType) data.scheduleType = mode;
  if (day !== null) data.dayOfWeek = day;
  if (departureMinutes !== null) {
    data.departureTime = minutesToTime(finalDepartureMinutes);
  }
  if (finalArrivalTime !== undefined) data.arrivalTime = finalArrivalTime;
  data.departureDate = mode === 'specific' ? parsedDepartureDate : null;
  data.arrivalDate = mode === 'specific'
    ? new Date(parsedDepartureDate!.getTime() + journey!.durationMinutes * 60_000)
    : null;
  if (finalArrivesNextDay !== undefined) data.arrivesNextDay = finalArrivesNextDay;

  const availabilityError = await validateResourceAvailability(
    finalDriverId,
    finalVehicleId,
    {
      scheduleType: mode,
      dayOfWeek: day ?? current.dayOfWeek,
      departureMinutes: finalDepartureMinutes,
      departureDate: parsedDepartureDate,
      durationMinutes: journey!.durationMinutes,
    },
    id
  );
  if (availabilityError) {
    res.status(409).json({ error: availabilityError });
    return;
  }

  const updatedTrip = await repository.update(data);
  if (updatedTrip) {
    res.status(200).json(updatedTrip);
  } else {
    res.status(404).json({ error: 'Viaje no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const trip = await repository.findOne({ id });
  if (!trip) {
    res.status(404).json({ error: 'Viaje no encontrado' });
    return;
  }
  await repository.deactivate({ id });
  res.json({ message: 'Viaje desactivado' });
}

async function reactivate(req: Request, res: Response) {
  const id = Number(req.params.id);
  const trip = await repository.findOne({ id });
  if (!trip) {
    res.status(404).json({ error: 'Viaje no encontrado' });
    return;
  }
  const updated = await repository.reactivate({ id });
  res.status(200).json({ ...updated, warning: 'Viaje reactivado' });
}

export {
  findAll,
  findAllInactive,
  findOne,
  add,
  update,
  remove,
  reactivate,
};