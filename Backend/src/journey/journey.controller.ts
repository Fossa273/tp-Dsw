import { Request, Response } from 'express';
import { JourneyRepository } from './journey.repository.js';
import { LocalityRepository } from '../locality/locality.repository.js';

const repository = new JourneyRepository();
const localityRepository = new LocalityRepository();

// Validates that both referenced localities exist and are different.
// Returns an error message string, or null when the input is valid.
async function validateLocalities(originId: number, destinationId: number) {
  if (originId === destinationId) {
    return 'El origen y el destino deben ser localidades distintas';
  }
  const origin = await localityRepository.findOne({ id: originId });
  if (!origin) {
    return 'La localidad de origen no existe';
  }
  const destination = await localityRepository.findOne({ id: destinationId });
  if (!destination) {
    return 'La localidad de destino no existe';
  }
  return null;
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Math.round(num);
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const journey = await repository.findOne({ id });
  if (journey) {
    res.json(journey);
  } else {
    res.status(404).json({ error: 'Trayecto no encontrado' });
  }
}

async function add(req: Request, res: Response) {
  const { originId, destinationId, distanceKm, durationMinutes } =
    req.body.sanitizeInput;

  if (originId === undefined || originId === null) {
    res.status(400).json({ error: 'La localidad de origen es obligatoria' });
    return;
  }
  if (destinationId === undefined || destinationId === null) {
    res.status(400).json({ error: 'La localidad de destino es obligatoria' });
    return;
  }

  const localityError = await validateLocalities(
    Number(originId),
    Number(destinationId)
  );
  if (localityError) {
    res.status(400).json({ error: localityError });
    return;
  }

  const existing = await repository.findByJourney(
    Number(originId),
    Number(destinationId)
  );
  if (existing) {
    res.status(409).json({
      error: 'Ya existe un trayecto entre esas localidades',
    });
    return;
  }

  const newJourney = await repository.add({
    originId: Number(originId),
    destinationId: Number(destinationId),
    distanceKm: normalizePositiveInt(distanceKm, 0),
    durationMinutes: normalizePositiveInt(durationMinutes, 0),
  });
  res.status(201).json(newJourney);
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { originId, destinationId, distanceKm, durationMinutes } =
    req.body.sanitizeInput;

  if (originId === undefined || originId === null) {
    res.status(400).json({ error: 'La localidad de origen es obligatoria' });
    return;
  }
  if (destinationId === undefined || destinationId === null) {
    res.status(400).json({ error: 'La localidad de destino es obligatoria' });
    return;
  }

  const localityError = await validateLocalities(
    Number(originId),
    Number(destinationId)
  );
  if (localityError) {
    res.status(400).json({ error: localityError });
    return;
  }

  const existing = await repository.findByJourney(
    Number(originId),
    Number(destinationId)
  );
  if (existing && existing.id !== id) {
    res.status(409).json({
      error: 'Ya existe un trayecto entre esas localidades',
    });
    return;
  }

  const updatedJourney = await repository.update({
    id,
    originId: Number(originId),
    destinationId: Number(destinationId),
    distanceKm: normalizePositiveInt(distanceKm, 0),
    durationMinutes: normalizePositiveInt(durationMinutes, 0),
  });
  if (updatedJourney) {
    res.status(200).json(updatedJourney);
  } else {
    res.status(404).json({ error: 'Trayecto no encontrado' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedJourney = await repository.delete({ id });
    if (deletedJourney) {
      res.json({ message: 'Trayecto eliminado' });
    } else {
      res.status(404).json({ error: 'Trayecto no encontrado' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Trayecto no encontrado' });
      return;
    }
    if (err?.code === 'P2003') {
      res.status(409).json({
        error:
          'No se puede eliminar el trayecto porque tiene viajes asociados',
      });
      return;
    }
    throw err;
  }
}

export { findAll, findOne, add, update, remove };