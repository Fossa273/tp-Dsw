import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { getYpfSuperPricePerLiter } from '../shared/fuel-price.service.js';
import { calculateFuelCost } from '../shared/pricing.service.js';
import { OPERATING_COST_MULTIPLIER } from '../shared/constants.js';
import { computeArrival, computeArrivalDate } from '../shared/trip-time.service.js';
import {
  sendBookingCancellationNotice,
} from '../booking/booking-email.service.js';
import { BookingRepository } from '../booking/booking.repository.js';
import { DriverRepository } from '../driver/driver.repository.js';
import { JourneyRepository } from '../journey/journey.repository.js';
import { VehicleRepository } from '../vehicle/vehicle.repository.js';
import { TripRepository } from './trip.repository.js';

type ScheduleInput = {
  scheduleType: string;
  dayOfWeek: number;
  departureMinutes: number;
  departureDate: Date | null;
  durationMinutes: number;
};

export class TripService {
  constructor(
    private readonly repository = new TripRepository(),
    private readonly bookingRepository = new BookingRepository(),
    private readonly journeyRepository = new JourneyRepository(),
    private readonly driverRepository = new DriverRepository(),
    private readonly vehicleRepository = new VehicleRepository()
  ) {}

  private roundToNext100(value: number) {
    return Math.ceil(value / 100) * 100;
  }

  private calculatePrice(trip: any, fuelPrice: number) {
    if (!trip?.vehicle?.categoryRelation) return null;
    const capacity = Number(trip.vehicle.maxCapacity);
    if (!Number.isFinite(capacity) || capacity <= 0) return null;
    const promoted =
      trip.isPromoted === 1 &&
      trip.promoPrice !== null &&
      Number.isFinite(Number(trip.promoPrice)) &&
      (!trip.promoExpiry || trip.promoExpiry > new Date());
    if (promoted) return Number(trip.promoPrice);
    const fuelCost = calculateFuelCost(
      trip.journey.distanceKm,
      trip.vehicle.categoryRelation.litrosPorKm,
      fuelPrice
    );
    const fuelPerSeat =
      (fuelCost * OPERATING_COST_MULTIPLIER) / capacity;
    return this.roundToNext100(
      fuelPerSeat + trip.vehicle.categoryRelation.precioBase
    );
  }

  private async withPrice<T extends Record<string, any>>(trip: T) {
    const fuelPrice = await getYpfSuperPricePerLiter();
    const [hours, minutes] = trip.departureTime
      .split(':')
      .slice(0, 2)
      .map(Number);
    const arrival = computeArrival(
      hours * 60 + minutes,
      trip.journey.durationMinutes
    );
    return {
      ...trip,
      arrivalTime: arrival.arrivalTime,
      arrivesNextDay: arrival.arrivesNextDay,
      arrivalDate:
        trip.scheduleType === 'specific' && trip.departureDate
          ? computeArrivalDate(trip.departureDate, trip.journey.durationMinutes)
          : null,
      pricePerPerson: this.calculatePrice(trip, fuelPrice),
    };
  }

  private parseTime(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  private dayOfWeek(value: unknown): number | null {
    if (typeof value === 'number') {
      return value >= 0 && value <= 6 ? value : null;
    }
    if (typeof value === 'string') {
      if (/^\d+$/.test(value.trim())) {
        const number = Number(value);
        return number >= 0 && number <= 6 ? number : null;
      }
      const days: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      return days[value.trim().toLowerCase()] ?? null;
    }
    return null;
  }

  private intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return aStart < bEnd && bStart < aEnd;
  }

  private weeklyIntervals(day: number, start: number, duration: number) {
    const end = start + duration + 10;
    const intervals = [{ day, start, end: Math.min(end, 1440) }];
    if (end > 1440) {
      intervals.push({ day: (day + 1) % 7, start: 0, end: end - 1440 });
    }
    return intervals;
  }

  private schedulesOverlap(existing: any, candidate: ScheduleInput) {
    if (candidate.scheduleType === 'specific' &&
        existing.scheduleType === 'specific') {
      if (!candidate.departureDate || !existing.departureDate || !existing.arrivalDate) {
        return false;
      }
      return candidate.departureDate <
        new Date(existing.arrivalDate.getTime() + 10 * 60000) &&
        new Date(candidate.departureDate.getTime() +
          (candidate.durationMinutes + 10) * 60000) >
        existing.departureDate;
    }
    const existingStart = existing.scheduleType === 'specific'
      ? existing.departureDate.getHours() * 60 + existing.departureDate.getMinutes()
      : this.parseTime(existing.departureTime)!;
    const existingDay = existing.scheduleType === 'specific'
      ? existing.departureDate.getDay()
      : existing.dayOfWeek;
    const existingDuration = existing.scheduleType === 'specific' &&
      existing.arrivalDate
      ? (existing.arrivalDate.getTime() - existing.departureDate.getTime()) / 60000
      : (() => {
          const end = this.parseTime(existing.arrivalTime)!;
          return (end - existingStart +
            (existing.arrivesNextDay ? 1440 : 0)) || 1440;
        })();
    const existingIntervals =
      this.weeklyIntervals(existingDay, existingStart, existingDuration);
    const candidateIntervals =
      candidate.scheduleType === 'specific'
        ? this.weeklyIntervals(
            candidate.departureDate!.getDay(),
            candidate.departureMinutes,
            candidate.durationMinutes
          )
        : this.weeklyIntervals(
            candidate.dayOfWeek,
            candidate.departureMinutes,
            candidate.durationMinutes
          );
    return existingIntervals.some((a) =>
      candidateIntervals.some((b) =>
        a.day === b.day &&
        this.intervalsOverlap(a.start, a.end, b.start, b.end)
      )
    );
  }

  private async validateAvailability(
    driverId: number,
    vehicleId: number,
    candidate: ScheduleInput,
    excludeId?: number
  ) {
    const trips = await this.repository.findActiveByResources(
      driverId,
      vehicleId
    );
    const conflict = trips.find(
      (trip) => trip.id !== excludeId &&
        this.schedulesOverlap(trip, candidate)
    );
    if (!conflict) return null;
    if (conflict.driverId === driverId && conflict.vehicleId === vehicleId) {
      return 'El conductor y el vehiculo ya estan asignados a otro viaje durante ese horario';
    }
    if (conflict.driverId === driverId) {
      return 'El conductor ya esta asignado a otro viaje durante ese horario';
    }
    return 'El vehiculo ya esta asignado a otro viaje durante ese horario';
  }

  async findAll(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 20));
    const search = typeof query.search === 'string' ? query.search : '';
    const sort = ['schedule', 'dayOfWeek', 'departureTime'].includes(
      String(query.sort)
    ) ? String(query.sort) : 'schedule';
    const order = query.order === 'desc' ? 'desc' : 'asc';
    const trips = query.page || query.limit || search
      ? await this.repository.paginated(
          page,
          limit,
          undefined,
          search,
          sort,
          order
        )
      : { data: await this.repository.findAll() };
    return {
      ...trips,
      data: await Promise.all(trips.data.map((trip) => this.withPrice(trip))),
    };
  }

  async findAllInactive() {
    const trips = await this.repository.findAllInactive();
    return { data: await Promise.all(trips.map((trip) => this.withPrice(trip))) };
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de viaje no es valido');
    }
    const trip = await this.repository.findOne({ id });
    if (!trip) throw new ApiError(404, 'Viaje no encontrado');
    return this.withPrice(trip);
  }

  async findPromoted() {
    const trips = await this.repository.findPromoted();
    return { data: await Promise.all(trips.map((trip) => this.withPrice(trip))) };
  }

  async search(query: Record<string, unknown>) {
    const trips = await this.repository.findAll();
    const filtered = trips.filter((trip) => {
      if (query.originId &&
          String(trip.journey?.originId) !== String(query.originId)) return false;
      if (query.destinationId &&
          String(trip.journey?.destinationId) !== String(query.destinationId)) {
        return false;
      }
      if (query.date) {
        const selectedDate = new Date(`${query.date}T12:00:00`);
        if (trip.scheduleType === 'specific' && trip.departureDate) {
          if (new Date(trip.departureDate).toISOString().slice(0, 10) !==
              String(query.date)) return false;
        } else if (Number(trip.dayOfWeek) !== selectedDate.getDay()) {
          return false;
        }
      }
      return true;
    });
    return {
      data: await Promise.all(filtered.map((trip) => this.withPrice(trip))),
    };
  }

  private async validateDependencies(
    journeyId: number,
    driverId: number,
    vehicleId: number
  ) {
    const [journey, driver, vehicle] = await Promise.all([
      this.journeyRepository.findOne({ id: journeyId }),
      this.driverRepository.findOne({ id: driverId }),
      this.vehicleRepository.findOne({ id: vehicleId }),
    ]);
    if (!journey) throw new ApiError(400, 'El trayecto seleccionado no existe');
    if (!driver) throw new ApiError(400, 'El conductor seleccionado no existe');
    if (!vehicle) throw new ApiError(400, 'El vehiculo seleccionado no existe');
    if (vehicle.maintenance) {
      throw new ApiError(400, 'El vehiculo seleccionado esta en mantenimiento');
    }
    return journey;
  }

  async add(input: {
    journeyId?: unknown;
    driverId?: unknown;
    vehicleId?: unknown;
    scheduleType?: unknown;
    dayOfWeek?: unknown;
    departureTime?: unknown;
    departureDate?: unknown;
    isPromoted?: unknown;
    promoExpiry?: unknown;
    promoPrice?: unknown;
  }) {
    if (input.journeyId == null ||
        input.driverId == null ||
        input.vehicleId == null) {
      throw new ApiError(
        400,
        'Debe indicar trayecto, conductor y vehiculo'
      );
    }
    if (input.isPromoted &&
        (!Number.isFinite(Number(input.promoPrice)) ||
         Number(input.promoPrice) <= 0)) {
      throw new ApiError(400, 'Debe indicar un precio promocional valido');
    }
    const mode = input.scheduleType === 'specific' ? 'specific' : 'weekly';
    const parsedDate =
      mode === 'specific' ? new Date(String(input.departureDate)) : null;
    if (mode === 'specific' &&
        (!input.departureDate ||
         Number.isNaN(parsedDate!.getTime()))) {
      throw new ApiError(
        400,
        'Debe indicar una fecha y hora de salida validas'
      );
    }
    const day = mode === 'specific'
      ? parsedDate!.getDay()
      : this.dayOfWeek(input.dayOfWeek);
    if (day === null) {
      throw new ApiError(
        400,
        'Debe indicar un dia de la semana (0=Domingo ... 6=Sabado)'
      );
    }
    const departureMinutes = mode === 'specific'
      ? parsedDate!.getHours() * 60 + parsedDate!.getMinutes()
      : this.parseTime(input.departureTime);
    if (departureMinutes === null) {
      throw new ApiError(
        400,
        'La hora de salida es obligatoria (formato HH:MM)'
      );
    }
    const journeyId = Number(input.journeyId);
    const driverId = Number(input.driverId);
    const vehicleId = Number(input.vehicleId);
    const journey = await this.validateDependencies(
      journeyId,
      driverId,
      vehicleId
    );
    const arrival = computeArrival(
      departureMinutes,
      journey.durationMinutes
    );
    const availabilityError = await this.validateAvailability(
      driverId,
      vehicleId,
      {
        scheduleType: mode,
        dayOfWeek: day,
        departureMinutes,
        departureDate: parsedDate,
        durationMinutes: journey.durationMinutes,
      }
    );
    if (availabilityError) throw new ApiError(409, availabilityError);
    return this.repository.add({
      journeyId,
      driverId,
      vehicleId,
      scheduleType: mode,
      dayOfWeek: day,
      departureTime: this.minutesToTime(departureMinutes),
      arrivalTime: arrival.arrivalTime,
      departureDate: parsedDate,
      arrivalDate: mode === 'specific'
        ? new Date(parsedDate!.getTime() +
            journey.durationMinutes * 60000)
        : null,
      arrivesNextDay: arrival.arrivesNextDay,
      isPromoted: input.isPromoted ? 1 : 0,
      promoExpiry: input.promoExpiry ? new Date(String(input.promoExpiry)) : null,
      promoPrice: input.isPromoted ? Number(input.promoPrice) : null,
    });
  }

  async remove(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de viaje no es valido');
    }
    const trip = await this.repository.findOneIncludingInactive({ id });
    if (!trip) throw new ApiError(404, 'Viaje no encontrado');
    const bookings = await this.bookingRepository.findByTripId(id);
    const emailWarnings: string[] = [];
    for (const booking of bookings) {
      if (booking.state === 'cancelled') continue;
      const cancelled = await this.bookingRepository.update({
        id: booking.id,
        state: 'cancelled',
      });
      if (cancelled) {
        const warning = await sendBookingCancellationNotice(
          cancelled,
          'cancelada'
        );
        if (warning) {
          emailWarnings.push(`Reserva #${booking.id}: ${warning}`);
        }
      }
    }
    await this.repository.deactivate({ id });
    return {
      message: 'Viaje desactivado y reservas canceladas',
      ...(emailWarnings.length
        ? { warning: `No se pudieron completar algunos avisos: ${emailWarnings.join('; ')}` }
        : {}),
    };
  }

  async reactivate(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de viaje no es valido');
    }
    const trip = await this.repository.findOneIncludingInactive({ id });
    if (!trip) throw new ApiError(404, 'Viaje no encontrado');
    const updated = await this.repository.reactivate({ id });
    return { ...updated, warning: 'Viaje reactivado' };
  }

  async update(rawId: unknown, input: {
    journeyId?: unknown;
    driverId?: unknown;
    vehicleId?: unknown;
    scheduleType?: unknown;
    dayOfWeek?: unknown;
    departureTime?: unknown;
    departureDate?: unknown;
    isPromoted?: unknown;
    promoExpiry?: unknown;
    promoPrice?: unknown;
  }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de viaje no es valido');
    }
    const current = await this.repository.findOne({ id });
    if (!current) throw new ApiError(404, 'Viaje no encontrado');
    const effectivePromoPrice =
      input.promoPrice ?? current.promoPrice;
    const promotionEnabled =
      input.isPromoted === undefined
        ? current.isPromoted === 1
        : Boolean(input.isPromoted);
    if (promotionEnabled &&
        (!Number.isFinite(Number(effectivePromoPrice)) ||
         Number(effectivePromoPrice) <= 0)) {
      throw new ApiError(400, 'Debe indicar un precio promocional valido');
    }
    const journeyId =
      input.journeyId != null ? Number(input.journeyId) : current.journeyId;
    const driverId =
      input.driverId != null ? Number(input.driverId) : current.driverId;
    const vehicleId =
      input.vehicleId != null ? Number(input.vehicleId) : current.vehicleId;
    const journey = await this.validateDependencies(
      journeyId,
      driverId,
      vehicleId
    );
    const mode = input.scheduleType === undefined
      ? current.scheduleType
      : input.scheduleType === 'specific' ? 'specific' : 'weekly';
    const parsedDate = mode === 'specific'
      ? new Date(String(
          input.departureDate ?? current.departureDate ?? ''
        ))
      : null;
    if (mode === 'specific' && Number.isNaN(parsedDate!.getTime())) {
      throw new ApiError(
        400,
        'Debe indicar una fecha y hora de salida validas'
      );
    }
    let day: number | null =
      mode === 'specific'
        ? parsedDate!.getDay()
        : input.dayOfWeek === undefined
          ? null
          : this.dayOfWeek(input.dayOfWeek);
    if (input.dayOfWeek !== undefined && day === null) {
      throw new ApiError(
        400,
        'El dia de la semana es invalido (0=Domingo ... 6=Sabado)'
      );
    }
    const departureMinutes = mode === 'specific'
      ? parsedDate!.getHours() * 60 + parsedDate!.getMinutes()
      : input.departureTime === undefined
        ? null
        : this.parseTime(input.departureTime);
    if (input.departureTime !== undefined && departureMinutes === null) {
      throw new ApiError(400, 'La hora de salida es invalida (HH:MM)');
    }
    const finalDepartureMinutes =
      departureMinutes ?? this.parseTime(current.departureTime)!;
    const arrival = computeArrival(
      finalDepartureMinutes,
      journey.durationMinutes
    );
    const availabilityError = await this.validateAvailability(
      driverId,
      vehicleId,
      {
        scheduleType: mode,
        dayOfWeek: day ?? current.dayOfWeek,
        departureMinutes: finalDepartureMinutes,
        departureDate: parsedDate,
        durationMinutes: journey.durationMinutes,
      },
      id
    );
    if (availabilityError) throw new ApiError(409, availabilityError);
    const updated = await this.repository.update({
      id,
      ...(journeyId !== current.journeyId ? { journeyId } : {}),
      ...(driverId !== current.driverId ? { driverId } : {}),
      ...(vehicleId !== current.vehicleId ? { vehicleId } : {}),
      ...(mode !== current.scheduleType ? { scheduleType: mode } : {}),
      ...(day !== null ? { dayOfWeek: day } : {}),
      ...(departureMinutes !== null
        ? { departureTime: this.minutesToTime(finalDepartureMinutes) }
        : {}),
      arrivalTime: arrival.arrivalTime,
      departureDate: mode === 'specific' ? parsedDate : null,
      arrivalDate: mode === 'specific'
        ? new Date(parsedDate!.getTime() +
            journey.durationMinutes * 60000)
        : null,
      arrivesNextDay: arrival.arrivesNextDay,
      ...(input.isPromoted !== undefined
        ? { isPromoted: input.isPromoted ? 1 : 0 }
        : {}),
      ...(input.promoExpiry !== undefined
        ? { promoExpiry: input.promoExpiry ? new Date(String(input.promoExpiry)) : null }
        : {}),
      ...(input.promoPrice !== undefined || input.isPromoted !== undefined
        ? { promoPrice: promotionEnabled ? Number(effectivePromoPrice) : null }
        : {}),
    });
    if (!updated) throw new ApiError(404, 'Viaje no encontrado');
    return updated;
  }
}
