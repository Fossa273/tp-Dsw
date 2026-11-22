import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { geocodeName, normalizeName } from '../shared/maps.service.js';
import { ProvinceRepository } from '../province/province.repository.js';
import { LocalityRepository } from './locality.repository.js';

type VerifyResult = {
  ambiguous?: boolean;
  candidates?: { id: number | null; name: string; abbreviation: string | null }[];
  warning?: string | null;
  provinceId?: number | null;
};

export class LocalityService {
  constructor(
    private readonly repository = new LocalityRepository(),
    private readonly provinceRepository = new ProvinceRepository()
  ) {}

  async findAll(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 20));
    const search = typeof query.search === 'string' ? query.search : '';
    const sort = query.sort === 'id' ? 'id' : 'name';
    const order = query.order === 'desc' ? 'desc' : 'asc';
    const provinceId = Number(query.provinceId);
    if (query.page || query.limit || search || query.provinceId) {
      return this.repository.paginated(
        page,
        limit,
        search,
        sort,
        order,
        Number.isInteger(provinceId) && provinceId > 0 ? provinceId : undefined
      );
    }
    return { data: await this.repository.findAll() };
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de localidad no es valido');
    }
    const locality = await this.repository.findOne({ id });
    if (!locality) throw new ApiError(404, 'Localidad no encontrada');
    return locality;
  }

  private normalizeProvinceId(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private normalizeProvinceName(value: string): string {
    const normalized = normalizeName(value);
    return normalized === 'ciudad autonoma de buenos aires'
      ? 'buenos aires'
      : normalized;
  }

  private async verifyLocality(
    name: string,
    provinceId: number | null
  ): Promise<VerifyResult> {
    let geocode;
    try {
      geocode = await geocodeName(name);
    } catch {
      return {
        warning:
          'No se pudo verificar la localidad con OpenStreetMap; se guarda de todos modos.',
        provinceId,
      };
    }
    if (geocode.status === 'not_found') {
      return {
        warning: 'OpenStreetMap no encontro la localidad; se guarda de todos modos.',
        provinceId,
      };
    }
    const provinces = await this.provinceRepository.findAll();
    const findByName = (provinceName: string) =>
      provinces.find(
        (province: { name?: string | null }) =>
          this.normalizeProvinceName(province.name ?? '') ===
          this.normalizeProvinceName(provinceName)
      );

    if (geocode.status === 'ambiguous') {
      const candidates = geocode.provinces
        .map((provinceName) => {
          const province = findByName(provinceName);
          return {
            id: province?.id ?? null,
            name: province?.name ?? provinceName,
            abbreviation: province?.abbreviation ?? null,
          };
        })
        .filter((candidate) => candidate.name);
      if (provinceId !== null) {
        const selected = provinces.find((province) => province.id === provinceId);
        const selectedName = this.normalizeProvinceName(selected?.name ?? '');
        if (geocode.provinces.some(
          (provinceName) =>
            this.normalizeProvinceName(provinceName) === selectedName
        )) {
          return { provinceId };
        }
      }
      return {
        ambiguous: true,
        candidates,
        warning:
          'OpenStreetMap encontro el nombre en varias provincias. Indique de cual se trata.',
      };
    }

    const resolved = findByName(geocode.province);
    const matchesSelected =
      provinceId !== null &&
      resolved !== undefined &&
      resolved.id === provinceId;
    if (provinceId === null && resolved) {
      return { provinceId: resolved.id };
    }
    if (provinceId !== null && !matchesSelected && resolved) {
      return {
        warning:
          `OpenStreetMap ubica "${name}" en ${geocode.province}, ` +
          'no en la provincia seleccionada. Se guarda de todos modos.',
        provinceId,
      };
    }
    return { provinceId };
  }

  async add(input: { name?: unknown; provinceId?: unknown }) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) throw new ApiError(400, 'El nombre es obligatorio');
    let provinceId = this.normalizeProvinceId(input.provinceId);
    if (provinceId !== null &&
        !await this.provinceRepository.findOne({ id: provinceId })) {
      throw new ApiError(400, 'La provincia seleccionada no existe');
    }
    const verification = await this.verifyLocality(name, provinceId);
    if (verification.ambiguous) {
      throw new ApiError(
        409,
        'El nombre de la localidad existe en varias provincias. Indique de cual se trata.',
        { candidates: verification.candidates ?? [] }
      );
    }
    if (verification.provinceId !== undefined) {
      provinceId = verification.provinceId;
    }
    if (await this.repository.findByNameAndProvince(name, provinceId)) {
      throw new ApiError(
        409,
        'Ya existe una localidad llamada "' + name +
        '" en la provincia seleccionada'
      );
    }
    const created = await this.repository.add({ name, provinceId });
    return {
      ...created,
      ...(verification.warning ? { warning: verification.warning } : {}),
    };
  }

  async update(rawId: unknown, input: { name?: unknown; provinceId?: unknown }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de localidad no es valido');
    }
    await this.findOne(id);
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) throw new ApiError(400, 'El nombre es obligatorio');
    let provinceId = this.normalizeProvinceId(input.provinceId);
    if (provinceId !== null &&
        !await this.provinceRepository.findOne({ id: provinceId })) {
      throw new ApiError(400, 'La provincia seleccionada no existe');
    }
    const verification = await this.verifyLocality(name, provinceId);
    if (verification.ambiguous) {
      throw new ApiError(
        409,
        'El nombre de la localidad existe en varias provincias. Indique de cual se trata.',
        { candidates: verification.candidates ?? [] }
      );
    }
    if (verification.provinceId !== undefined) {
      provinceId = verification.provinceId;
    }
    if (await this.repository.findByNameAndProvince(name, provinceId, id)) {
      throw new ApiError(
        409,
        'Ya existe una localidad llamada "' + name +
        '" en la provincia seleccionada'
      );
    }
    const updated = await this.repository.update({ id, name, provinceId });
    if (!updated) throw new ApiError(404, 'Localidad no encontrada');
    return {
      ...updated,
      ...(verification.warning ? { warning: verification.warning } : {}),
    };
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de localidad no es valido');
    }
    await this.findOne(id);
    if (await this.repository.countAssociatedJourneys(id) > 0) {
      throw new ApiError(
        409,
        'No se puede eliminar la localidad porque tiene trayectos asociados'
      );
    }
    await this.repository.delete({ id });
    return { message: 'Localidad eliminada' };
  }
}
