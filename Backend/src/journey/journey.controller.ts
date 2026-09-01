import { Request, Response } from 'express';
import { JourneyRepository } from './journey.repository.js';
import { LocalityRepository } from '../locality/locality.repository.js';
import {
  getDistanceKm,
  durationFromDistance,
} from '../shared/maps.service.js';

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

// "CABA, Buenos Aires, Argentina" (province improves geocoding)
function localityLabel(locality: any): string {
  const base = locality?.name?.trim() ?? '';
  const province = locality?.province?.name?.trim();
  return province ? `${base}, ${province}, Argentina` : `${base}, Argentina`;
}

// Loads both localities (with their province) to build geocoding labels.
async function loadLocalityLabel(id: number) {
  const loc = await localityRepository.findOne({ id });
  if (!loc) {
    return null;
  }
  return { id, label: localityLabel(loc) };
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

// Computes distanceKm (Google Maps) and durationMinutes (fixed 90 km/h).
// With manualDistanceKm === null, relies on the Distance Matrix API.
// Returns { distanceKm, durationMinutes, warning? } or { error }.
async function resolveDistanceAndDuration(
  originId: number,
  destinationId: number,
  manualDistanceKm: number | null,
  manualDurationMinutes: number | null
) {
  let distanceKm = manualDistanceKm;
  let warning: string | undefined;

  if (manualDistanceKm === null) {
    const origin = await loadLocalityLabel(originId);
    const destination = await loadLocalityLabel(destinationId);
    if (!origin || !destination) {
      return { error: 'No se pudieron cargar las localidades' };
    }
    try {
      distanceKm = await getDistanceKm(origin.label, destination.label);
    } catch (err: any) {
      return {
        error:
          (err?.message ?? 'No se pudo calcular la distancia') +
          '. Podes ingresar la distancia manualmente.',
      };
    }
  }

  const durationMinutes =
    manualDurationMinutes === null
      ? durationFromDistance(distanceKm!)
      : manualDurationMinutes;

  return { distanceKm: distanceKm!, durationMinutes, warning };
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

  const originIdNum = Number(originId);
  const destinationIdNum = Number(destinationId);

  const localityError = await validateLocalities(
    originIdNum,
    destinationIdNum
  );
  if (localityError) {
    res.status(400).json({ error: localityError });
    return;
  }

  const existing = await repository.findByJourney(originIdNum, destinationIdNum);
  if (existing) {
    res.status(409).json({
      error: 'Ya existe un trayecto entre esas localidades',
    });
    return;
  }

  // distanceKm provided -> manual override; otherwise auto-calculated by Google.
  const isManualDistance =
    distanceKm !== undefined && distanceKm !== null && Number(distanceKm) > 0;
  const isManualDuration =
    durationMinutes !== undefined &&
    durationMinutes !== null &&
    Number(durationMinutes) >= 0;

  const resolved = await resolveDistanceAndDuration(
    originIdNum,
    destinationIdNum,
    isManualDistance ? normalizePositiveInt(distanceKm, 0) : null,
    isManualDuration ? normalizePositiveInt(durationMinutes, 0) : null
  );
  if ('error' in resolved) {
    res.status(502).json({ error: resolved.error });
    return;
  }

  const newJourney = await repository.add({
    originId: originIdNum,
    destinationId: destinationIdNum,
    distanceKm: resolved.distanceKm,
    durationMinutes: resolved.durationMinutes,
  });
  res.status(201).json({
    ...newJourney,
    ...(resolved.warning ? { warning: resolved.warning } : {}),
  });
}

async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { originId, destinationId, distanceKm, durationMinutes } =
    req.body.sanitizeInput;

  const current = await repository.findOne({ id });
  if (!current) {
    res.status(404).json({ error: 'Trayecto no encontrado' });
    return;
  }

  const finalOriginId = originId !== undefined && originId !== null ? Number(originId) : current.originId;
  const finalDestinationId =
    destinationId !== undefined && destinationId !== null
      ? Number(destinationId)
      : current.destinationId;

  const localityError = await validateLocalities(
    finalOriginId,
    finalDestinationId
  );
  if (localityError) {
    res.status(400).json({ error: localityError });
    return;
  }

  const existing = await repository.findByJourney(
    finalOriginId,
    finalDestinationId
  );
  if (existing && existing.id !== id) {
    res.status(409).json({
      error: 'Ya existe un trayecto entre esas localidades',
    });
    return;
  }

  const originChanged = finalOriginId !== current.originId;
  const destinationChanged = finalDestinationId !== current.destinationId;
  const isManualDistance =
    distanceKm !== undefined && distanceKm !== null && Number(distanceKm) > 0;
  const isManualDuration =
    durationMinutes !== undefined &&
    durationMinutes !== null &&
    Number(durationMinutes) >= 0;

  // Recalculate when localities changed or no distance was provided.
  const needsRecompute =
    originChanged || destinationChanged || current.distanceKm === null || !isManualDistance;

  let distance: number | undefined;
  let duration: number | undefined;
  let warning: string | undefined;

  if (needsRecompute) {
    const manualDistance = isManualDistance ? normalizePositiveInt(distanceKm, 0) : null;
    const manualDuration = isManualDuration ? normalizePositiveInt(durationMinutes, 0) : null;
    const resolved = await resolveDistanceAndDuration(
      finalOriginId,
      finalDestinationId,
      manualDistance,
      manualDuration
    );
    if ('error' in resolved) {
      res.status(502).json({ error: resolved.error });
      return;
    }
    distance = resolved.distanceKm;
    duration = resolved.durationMinutes;
    warning = resolved.warning;
  } else {
    // Keep changes to distance/duration only.
    distance = isManualDistance ? normalizePositiveInt(distanceKm, 0) : undefined;
    duration = isManualDuration
      ? normalizePositiveInt(durationMinutes, 0)
      : undefined;
  }

  const updatedJourney = await repository.update({
    id,
    originId: finalOriginId,
    destinationId: finalDestinationId,
    distanceKm: distance,
    durationMinutes: duration,
  });
  if (updatedJourney) {
    res.status(200).json({
      ...updatedJourney,
      ...(warning ? { warning } : {}),
    });
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