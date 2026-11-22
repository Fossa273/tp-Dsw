import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { getDistanceKm, durationFromDistance } from '../shared/maps.service.js';
import { LocalityRepository } from '../locality/locality.repository.js';
import { TripRepository } from '../trip/trip.repository.js';
import { JourneyRepository } from './journey.repository.js';

export class JourneyService {
  constructor(
    private readonly repository = new JourneyRepository(),
    private readonly tripRepository = new TripRepository(),
    private readonly localityRepository = new LocalityRepository()
  ) {}

  async findAll(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 20));
    const search = typeof query.search === 'string' ? query.search : '';
    const sort = ['id', 'distanceKm', 'durationMinutes'].includes(String(query.sort))
      ? String(query.sort)
      : 'id';
    const order = query.order === 'desc' ? 'desc' : 'asc';
    if (query.page || query.limit || search) {
      return this.repository.paginated(page, limit, search, sort, order);
    }
    return { data: await this.repository.findAll() };
  }

  findAllInactive() {
    return this.repository.findAllInactive();
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de trayecto no es valido');
    }
    const journey = await this.repository.findOne({ id });
    if (!journey) throw new ApiError(404, 'Trayecto no encontrado');
    return journey;
  }

  private normalizePositiveInt(value: unknown, fallback: number) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return fallback;
    return Math.round(number);
  }

  private async validateLocalities(originId: number, destinationId: number) {
    if (originId === destinationId) {
      throw new ApiError(
        400,
        'El origen y el destino deben ser localidades distintas'
      );
    }
    if (!await this.localityRepository.findOne({ id: originId })) {
      throw new ApiError(400, 'La localidad de origen no existe');
    }
    if (!await this.localityRepository.findOne({ id: destinationId })) {
      throw new ApiError(400, 'La localidad de destino no existe');
    }
  }

  private async resolveDistanceAndDuration(
    originId: number,
    destinationId: number,
    manualDistanceKm: number | null,
    manualDurationMinutes: number | null
  ) {
    let distanceKm = manualDistanceKm;
    let warning: string | undefined;
    if (manualDistanceKm === null) {
      const [origin, destination] = await Promise.all([
        this.localityRepository.findOne({ id: originId }),
        this.localityRepository.findOne({ id: destinationId }),
      ]);
      if (!origin || !destination) {
        throw new ApiError(400, 'No se pudieron cargar las localidades');
      }
      const localityLabel = (locality: any) => {
        const base = locality?.name?.trim() ?? '';
        const province = locality?.province?.name?.trim();
        return province
          ? `${base}, ${province}, Argentina`
          : `${base}, Argentina`;
      };
      try {
        distanceKm = await getDistanceKm(
          localityLabel(origin),
          localityLabel(destination)
        );
      } catch (error: any) {
        throw new ApiError(
          502,
          `${error?.message ?? 'No se pudo calcular la distancia'}. Podes ingresar la distancia manualmente.`,
          { code: 'DISTANCE_CALCULATION_FAILED' }
        );
      }
      if (distanceKm === null || !Number.isFinite(distanceKm)) {
        throw new ApiError(
          502,
          'No se pudo calcular la distancia. Podes ingresar la distancia manualmente.'
        );
      }
    }
    const durationMinutes =
      manualDurationMinutes === null
        ? durationFromDistance(distanceKm!)
        : manualDurationMinutes;
    if (manualDistanceKm === null) {
      warning =
        'La distancia se calculo automaticamente con OpenStreetMap. ' +
        'Verifique el recorrido antes de guardar.';
    }
    return { distanceKm: distanceKm!, durationMinutes, warning };
  }

  async add(input: {
    originId?: unknown;
    destinationId?: unknown;
    distanceKm?: unknown;
    durationMinutes?: unknown;
  }) {
    if (input.originId === undefined || input.originId === null) {
      throw new ApiError(400, 'La localidad de origen es obligatoria');
    }
    if (input.destinationId === undefined || input.destinationId === null) {
      throw new ApiError(400, 'La localidad de destino es obligatoria');
    }
    const originId = Number(input.originId);
    const destinationId = Number(input.destinationId);
    await this.validateLocalities(originId, destinationId);
    if (await this.repository.findByJourney(originId, destinationId)) {
      throw new ApiError(409, 'Ya existe un trayecto entre esas localidades');
    }
    const manualDistance =
      input.distanceKm !== undefined &&
      input.distanceKm !== null &&
      Number(input.distanceKm) > 0
        ? this.normalizePositiveInt(input.distanceKm, 0)
        : null;
    const manualDuration =
      input.durationMinutes !== undefined &&
      input.durationMinutes !== null &&
      Number(input.durationMinutes) >= 0
        ? this.normalizePositiveInt(input.durationMinutes, 0)
        : null;
    const resolved = await this.resolveDistanceAndDuration(
      originId,
      destinationId,
      manualDistance,
      manualDuration
    );
    const journey = await this.repository.add({
      originId,
      destinationId,
      distanceKm: resolved.distanceKm,
      durationMinutes: resolved.durationMinutes,
    });
    return {
      ...journey,
      ...(resolved.warning ? { warning: resolved.warning } : {}),
    };
  }

  async update(rawId: unknown, input: {
    originId?: unknown;
    destinationId?: unknown;
    distanceKm?: unknown;
    durationMinutes?: unknown;
  }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de trayecto no es valido');
    }
    const current = await this.repository.findOne({ id });
    if (!current) throw new ApiError(404, 'Trayecto no encontrado');
    const originId =
      input.originId !== undefined && input.originId !== null
        ? Number(input.originId)
        : current.originId!;
    const destinationId =
      input.destinationId !== undefined && input.destinationId !== null
        ? Number(input.destinationId)
        : current.destinationId!;
    await this.validateLocalities(originId, destinationId);
    const existing = await this.repository.findByJourney(originId, destinationId);
    if (existing && existing.id !== id) {
      throw new ApiError(409, 'Ya existe un trayecto entre esas localidades');
    }
    const originChanged = originId !== current.originId;
    const destinationChanged = destinationId !== current.destinationId;
    const manualDistance =
      input.distanceKm !== undefined &&
      input.distanceKm !== null &&
      Number(input.distanceKm) > 0
        ? this.normalizePositiveInt(input.distanceKm, 0)
        : null;
    const manualDuration =
      input.durationMinutes !== undefined &&
      input.durationMinutes !== null &&
      Number(input.durationMinutes) >= 0
        ? this.normalizePositiveInt(input.durationMinutes, 0)
        : null;
    const needsRecompute =
      originChanged ||
      destinationChanged ||
      current.distanceKm === null ||
      manualDistance === null;
    let distance: number | undefined;
    let duration: number | undefined;
    let warning: string | undefined;
    if (needsRecompute) {
      const resolved = await this.resolveDistanceAndDuration(
        originId,
        destinationId,
        manualDistance,
        manualDuration
      );
      distance = resolved.distanceKm;
      duration = resolved.durationMinutes;
      warning = resolved.warning;
    } else {
      distance = manualDistance ?? undefined;
      duration = manualDuration ?? undefined;
    }
    const updated = await this.repository.update({
      id,
      originId,
      destinationId,
      distanceKm: distance,
      durationMinutes: duration,
    });
    if (!updated) throw new ApiError(404, 'Trayecto no encontrado');
    if (duration !== undefined && duration !== current.durationMinutes) {
      await this.tripRepository.refreshArrivalsForJourney(
        id,
        updated.durationMinutes
      );
    }
    return {
      ...updated,
      ...(warning ? { warning } : {}),
    };
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de trayecto no es valido');
    }
    await this.findOne(id);
    if (await this.tripRepository.findActiveByJourney(id) > 0) {
      throw new ApiError(
        409,
        'No se puede eliminar el trayecto porque tiene viajes activos. Elimine esos viajes primero.'
      );
    }
    await this.repository.deactivate({ id });
    return { message: 'Trayecto dado de baja correctamente' };
  }

  async reactivate(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de trayecto no es valido');
    }
    if (!await this.repository.reactivate({ id })) {
      throw new ApiError(
        404,
        'No se encontro un trayecto dado de baja con ese id'
      );
    }
    return { message: 'Trayecto dado de alta correctamente' };
  }
}
