import { Request, Response } from 'express';
import { LocalityRepository } from './locality.repository.js';
import { ProvinceRepository } from '../province/province.repository.js';
import {
  geocodeName,
  normalizeName,
  getApiKeyConfigured,
} from '../shared/maps.service.js';

const repository = new LocalityRepository();
const provinceRepository = new ProvinceRepository();

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  const locality = await repository.findOne({ id });
  if (locality) {
    res.json(locality);
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

function normalizeProvinceId(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Verifies with Google Maps that a locality name belongs to a province.
// Returns:
//   { error: string | null, warning: string | null, candidates: ... , provinceId: number | null }
// When Google finds the name in several provinces, `ambiguous` is true and
// the caller must ask the user to clarify which province it is.
type VerifyResult = {
  ambiguous?: boolean;
  candidates?: { name: string; abbreviation: string | null }[];
  warning?: string | null;
  provinceId?: number | null;
};

async function verifyLocality(
  name: string,
  provinceId: number | null
): Promise<VerifyResult> {
  if (!getApiKeyConfigured()) {
    return { warning: 'No se configuro la API key de Google Maps', provinceId };
  }

  let geocode;
  try {
    geocode = await geocodeName(name);
  } catch {
    return {
      warning:
        'No se pudo verificar la localidad con Google Maps; se guarda de todos modos.',
      provinceId,
    };
  }

  if (geocode.status === 'not_found') {
    return {
      warning:
        'Google Maps no encontro la localidad; se guarda de todos modos.',
      provinceId,
    };
  }

  const allProvinces = await provinceRepository.findAll();
  const findByName = (nm: string) =>
    allProvinces.find((p: { name?: string | null }) => normalizeName(p.name ?? '') === normalizeName(nm));

  if (geocode.status === 'ambiguous') {
    const candidates = geocode.provinces
      .map((nm) => {
        const p = findByName(nm);
        return { name: p?.name ?? nm, abbreviation: p?.abbreviation ?? null };
      })
      .filter((c) => c.name);
    return {
      ambiguous: true,
      candidates,
      warning:
        'El nombre de la localidad existe en varias provincias. Indique de cual se trata.',
    };
  }

  const provinceName = geocode.province;
  const resolved = findByName(provinceName);

  // Google resolved it to a single province.
  const matchesSelected =
    provinceId !== null &&
    resolved !== undefined &&
    resolved.id === provinceId;

  if (provinceId === null && resolved) {
    // Auto-assign the province Google found when the user did not pick one.
    return { provinceId: resolved.id };
  }

  if (provinceId !== null && !matchesSelected && resolved) {
    return {
      warning: `Google Maps ubica "${name}" en ${provinceName}, no en la provincia seleccionada. Se guarda de todos modos.`,
      provinceId,
    };
  }

  return { provinceId };
}

async function add(req: Request, res: Response) {
  const { name, provinceId: rawProvinceId } = req.body.sanitizeInput;
  if (!name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existing = await repository.findByName(name);
  if (existing) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${name}"`,
    });
    return;
  }

  let provinceId = normalizeProvinceId(rawProvinceId);
  if (provinceId !== null) {
    const province = await provinceRepository.findOne({ id: provinceId });
    if (!province) {
      res.status(400).json({ error: 'La provincia seleccionada no existe' });
      return;
    }
  }

  const verification = await verifyLocality(name, provinceId);
  if (verification.ambiguous) {
    res.status(409).json({
      error:
        'El nombre de la localidad existe en varias provincias. Indique de cual se trata.',
      candidates: verification.candidates ?? [],
    });
    return;
  }
  if (verification.provinceId !== undefined) {
    provinceId = verification.provinceId;
  }

  const created = await repository.add({ name, provinceId });
  res.status(201).json({
    ...created,
    ...(verification.warning ? { warning: verification.warning } : {}),
  });
}

async function update(req: Request, res: Response) {
  const { name, provinceId: rawProvinceId } = req.body.sanitizeInput;
  const id = Number(req.params.id);
  if (!name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const existing = await repository.findByName(name);
  if (existing && existing.id !== id) {
    res.status(409).json({
      error: `Ya existe una localidad con el nombre "${name}"`,
    });
    return;
  }

  const current = await repository.findOne({ id });
  if (!current) {
    res.status(404).json({ error: 'Localidad no encontrada' });
    return;
  }

  let provinceId = normalizeProvinceId(rawProvinceId);
  if (provinceId !== null) {
    const province = await provinceRepository.findOne({ id: provinceId });
    if (!province) {
      res.status(400).json({ error: 'La provincia seleccionada no existe' });
      return;
    }
  }

  const verification = await verifyLocality(name, provinceId);
  if (verification.ambiguous) {
    res.status(409).json({
      error:
        'El nombre de la localidad existe en varias provincias. Indique de cual se trata.',
      candidates: verification.candidates ?? [],
    });
    return;
  }
  if (verification.provinceId !== undefined) {
    provinceId = verification.provinceId;
  }

  const updated = await repository.update({
    id,
    name,
    provinceId,
  });
  if (updated) {
    res.status(200).json({
      ...updated,
      ...(verification.warning ? { warning: verification.warning } : {}),
    });
  } else {
    res.status(404).json({ error: 'Localidad no encontrada' });
  }
}

async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const deletedLocality = await repository.delete({ id });
    if (deletedLocality) {
      res.json({ message: 'Localidad eliminada' });
    } else {
      res.status(404).json({ error: 'Localidad no encontrada' });
    }
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'Localidad no encontrada' });
      return;
    }
    if (err?.code === 'P2003') {
      res.status(409).json({
        error: 'No se puede eliminar la localidad porque tiene trayectos asociados',
      });
      return;
    }
    throw err;
  }
}

export { findAll, findOne, add, update, remove };