import { ApiError, isPositiveInteger } from '../shared/api-error.js';
import { validatePersonContact } from '../shared/person-validation.js';
import { calculateFuelCost } from '../shared/pricing.service.js';
import { OPERATING_COST_MULTIPLIER } from '../shared/constants.js';
import { getYpfSuperPricePerLiter } from '../shared/fuel-price.service.js';
import {
  getBookingEmailRecipients,
  sendBookingCancellationNotice,
  sendBookingConfirmationEmail,
} from './booking-email.service.js';
import { BookingRepository } from './booking.repository.js';
import { ClientRepository } from '../client/client.repository.js';
import { TripRepository } from '../trip/trip.repository.js';

const VALID_STATES = ['pending', 'confirmed', 'cancelled'];

export class BookingService {
  constructor(
    private readonly repository = new BookingRepository(),
    private readonly clientRepository = new ClientRepository(),
    private readonly tripRepository = new TripRepository()
  ) {}

  async findAll(
    query: Record<string, unknown>,
    user?: { id: number; role: 'admin' | 'client' }
  ) {
    const requestedPage = Number(query.page);
    const requestedLimit = Number(query.limit);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 20)
        : 20;
    const clientId =
      query.clientId === undefined ? undefined : Number(query.clientId);
    const normalizedClientId =
      user?.role === 'admin'
        ? (Number.isInteger(clientId) ? clientId : undefined)
        : user?.id;
    const states =
      typeof query.states === 'string'
        ? query.states
            .split(',')
            .filter((state) => VALID_STATES.includes(state))
        : undefined;
    const dateFrom =
      typeof query.dateFrom === 'string'
        ? new Date(`${query.dateFrom}T00:00:00.000`)
        : undefined;
    const dateTo =
      typeof query.dateTo === 'string'
        ? new Date(`${query.dateTo}T23:59:59.999`)
        : undefined;
    return this.repository.paginated(
      page,
      limit,
      normalizedClientId,
      {
        search: typeof query.search === 'string' ? query.search : undefined,
        states,
        includeCompleted: query.includeCompleted !== 'false',
        dateFrom:
          dateFrom && !Number.isNaN(dateFrom.getTime())
            ? dateFrom
            : undefined,
        dateTo:
          dateTo && !Number.isNaN(dateTo.getTime())
            ? dateTo
            : undefined,
      }
    );
  }

  async findOne(rawId: unknown) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de reserva no es valido');
    }
    const booking = await this.repository.findOne({ id });
    if (!booking) throw new ApiError(404, 'Reserva no encontrada');
    return booking;
  }

  private normalizeSeats(value: unknown): number | null {
    const seats = Number(value);
    if (!Number.isInteger(seats) || seats < 1) return null;
    return seats;
  }

  private nextWeeklyDeparture(dayOfWeek: number, departureTime: string) {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departure = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );
    departure.setDate(
      departure.getDate() +
        (dayOfWeek - now.getDay() + 7) % 7
    );
    if (departure <= now) {
      departure.setDate(departure.getDate() + 7);
    }
    return departure;
  }

  private async validateBookingWindow(tripId: number) {
    const trip = await this.tripRepository.findOne({ id: tripId });
    if (!trip) return 'El viaje seleccionado no existe';
    if (trip.active === 0) return 'El viaje seleccionado esta desactivado';
    const departure =
      trip.scheduleType === 'specific' && trip.departureDate
        ? trip.departureDate
        : this.nextWeeklyDeparture(trip.dayOfWeek, trip.departureTime);
    const maximum = new Date();
    maximum.setMonth(maximum.getMonth() + 1);
    if (departure <= new Date()) {
      return 'No se puede reservar un viaje que ya paso';
    }
    if (departure > maximum) {
      return 'Las reservas solo pueden hacerse hasta un mes antes del viaje';
    }
    return null;
  }

  private async validateCapacity(
    tripId: number,
    seats: number,
    excludeBookingId?: number
  ) {
    const trip = await this.tripRepository.findOne({ id: tripId });
    if (!trip) return 'El viaje seleccionado no existe';
    if (trip.active === 0) return 'El viaje seleccionado esta desactivado';
    const capacity = trip.vehicle?.maxCapacity ?? 0;
    const usedSeats = await this.repository.sumSeatsByTrip(
      tripId,
      excludeBookingId
    );
    if (usedSeats + seats > capacity) {
      return `El viaje no tiene suficientes asientos disponibles (capacidad ${capacity}, asientos ya reservados ${usedSeats})`;
    }
    return null;
  }

  private validatePassengers(
    seats: number,
    isGuest: boolean,
    passengerList: any[] | null,
    input: Record<string, unknown>
  ) {
    if (passengerList && passengerList.length !== seats) {
      throw new ApiError(
        400,
        'Debe completar los datos de un pasajero por cada asiento reservado'
      );
    }
    if (isGuest && (!passengerList || passengerList.length !== seats)) {
      throw new ApiError(
        400,
        'Debe completar los datos de todos los pasajeros invitados'
      );
    }
    if (passengerList) {
      for (const passenger of passengerList) {
        const values = [
          passenger?.firstName,
          passenger?.lastName,
          passenger?.dni,
          passenger?.phone,
          passenger?.email,
        ];
        if (values.some((value) => !String(value ?? '').trim())) {
          throw new ApiError(
            400,
            'Todos los datos de los pasajeros son obligatorios'
          );
        }
        const contactError = validatePersonContact(
          passenger.dni,
          passenger.phone
        );
        if (contactError) throw new ApiError(400, contactError);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          String(passenger.email).trim()
        )) {
          throw new ApiError(400, 'El email de cada pasajero no es valido');
        }
      }
      return;
    }
    if (isGuest) {
      const fields = [
        input.passengerFirstName,
        input.passengerLastName,
        input.passengerDni,
        input.passengerPhone,
        input.passengerEmail,
      ];
      if (fields.some((value) => !String(value ?? '').trim())) {
        throw new ApiError(
          400,
          'Para reservar como invitado debe completar todos los datos del pasajero'
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(input.passengerEmail).trim()
      )) {
        throw new ApiError(400, 'El email del pasajero no es valido');
      }
      const contactError = validatePersonContact(
        input.passengerDni,
        input.passengerPhone
      );
      if (contactError) throw new ApiError(400, contactError);
    }
  }

  async add(
    input: Record<string, unknown>,
    user?: { id: number; role: 'admin' | 'client' }
  ) {
    if (input.tripId == null) {
      throw new ApiError(400, 'El viaje es obligatorio');
    }
    const seats = this.normalizeSeats(input.numSeats);
    if (seats === null) {
      throw new ApiError(
        400,
        'La cantidad de asientos debe ser un entero mayor a 0'
      );
    }
    if (user?.role === 'client' &&
        input.clientId !== undefined &&
        Number(input.clientId) !== user.id) {
      throw new ApiError(
        403,
        'No puede crear una reserva para otro cliente'
      );
    }
    const effectiveClientId =
      user?.role === 'client' ? user.id : input.clientId;
    const isGuest =
      effectiveClientId === undefined || effectiveClientId === null;
    const passengerList = Array.isArray(input.passengers)
      ? input.passengers
      : null;
    this.validatePassengers(seats, isGuest, passengerList, input);
    if (input.state !== undefined &&
        !VALID_STATES.includes(String(input.state).toLowerCase())) {
      throw new ApiError(
        400,
        'El estado debe ser pending, confirmed o cancelled'
      );
    }
    if (!isGuest &&
        !await this.clientRepository.findOne({
          id: Number(effectiveClientId),
        })) {
      throw new ApiError(400, 'El cliente seleccionado no existe');
    }
    const tripId = Number(input.tripId);
    const bookingWindowError =
      await this.validateBookingWindow(tripId);
    if (bookingWindowError) throw new ApiError(400, bookingWindowError);
    const capacityError = await this.validateCapacity(tripId, seats);
    if (capacityError) throw new ApiError(400, capacityError);
    const trip = await this.tripRepository.findOne({ id: tripId });
    if (!trip || !trip.vehicle?.categoryRelation) {
      throw new ApiError(
        400,
        'El vehiculo no tiene una categoria con precio base asignado'
      );
    }
    const capacity = trip.vehicle.maxCapacity;
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new ApiError(400, 'El vehiculo no tiene una capacidad valida');
    }
    const fuelPrice = await getYpfSuperPricePerLiter();
    const fuelPerSeat =
      (calculateFuelCost(
        trip.journey.distanceKm,
        trip.vehicle.categoryRelation.litrosPorKm,
        fuelPrice
      ) * OPERATING_COST_MULTIPLIER) / capacity;
    const promoted =
      trip.isPromoted === 1 &&
      trip.promoPrice !== null &&
      Number.isFinite(Number(trip.promoPrice)) &&
      (!trip.promoExpiry || trip.promoExpiry > new Date());
    const price = promoted
      ? Number(trip.promoPrice) * seats
      : Math.ceil((fuelPerSeat +
          trip.vehicle.categoryRelation.precioBase) *
          seats / 100) * 100;
    const firstPassenger = passengerList?.[0];
    return this.repository.addWithCapacity(
      {
        clientId: isGuest ? null : Number(effectiveClientId),
        tripId,
        numSeats: seats,
        state: input.state
          ? String(input.state).toLowerCase()
          : 'pending',
        price,
        passengerFirstName:
          String(firstPassenger?.firstName ?? input.passengerFirstName ?? '').trim() ||
          undefined,
        passengerLastName:
          String(firstPassenger?.lastName ?? input.passengerLastName ?? '').trim() ||
          undefined,
        passengerDni:
          String(firstPassenger?.dni ?? input.passengerDni ?? '').trim() ||
          undefined,
        passengerPhone:
          String(firstPassenger?.phone ?? input.passengerPhone ?? '').trim() ||
          undefined,
        passengerEmail:
          String(firstPassenger?.email ?? input.passengerEmail ?? '').trim() ||
          undefined,
        passengers: passengerList ?? undefined,
      },
      capacity
    );
  }

  async update(
    rawId: unknown,
    input: Record<string, unknown>,
    user?: { id: number; role: 'admin' | 'client' }
  ) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de reserva no es valido');
    }
    const current = await this.repository.findOne({ id });
    if (!current) throw new ApiError(404, 'Reserva no encontrada');
    if (user?.role === 'client' && current.clientId !== user.id) {
      throw new ApiError(403, 'No puede modificar una reserva de otro cliente');
    }
    if (user?.role === 'client' &&
        input.clientId !== undefined &&
        Number(input.clientId) !== user.id) {
      throw new ApiError(
        403,
        'No puede asignar la reserva a otro cliente'
      );
    }
    if (input.state !== undefined &&
        !VALID_STATES.includes(String(input.state).toLowerCase())) {
      throw new ApiError(
        400,
        'El estado debe ser pending, confirmed o cancelled'
      );
    }
    if (input.clientId !== undefined && input.clientId !== null &&
        !await this.clientRepository.findOne({
          id: Number(input.clientId),
        })) {
      throw new ApiError(400, 'El cliente seleccionado no existe');
    }
    if (input.tripId !== undefined && input.tripId !== null) {
      const tripError = await this.validateBookingWindow(Number(input.tripId));
      if (tripError) throw new ApiError(400, tripError);
    }
    if (input.tripId !== undefined && input.tripId !== null ||
        input.numSeats !== undefined && input.numSeats !== null) {
      const tripId =
        input.tripId !== undefined && input.tripId !== null
          ? Number(input.tripId)
          : current.tripId;
      const seats =
        input.numSeats === undefined
          ? current.numSeats
          : this.normalizeSeats(input.numSeats);
      if (seats === null) {
        throw new ApiError(
          400,
          'La cantidad de asientos debe ser un entero mayor a 0'
        );
      }
      const capacityError =
        await this.validateCapacity(tripId, seats, id);
      if (capacityError) throw new ApiError(400, capacityError);
    }
    const shouldConfirm =
      current.state !== 'confirmed' &&
      String(input.state ?? '').toLowerCase() === 'confirmed';
    const shouldCancel =
      current.state !== 'cancelled' &&
      String(input.state ?? '').toLowerCase() === 'cancelled';
    const updated = await this.repository.update({
      id,
      ...(input.clientId !== undefined
        ? { clientId:
            input.clientId === null
              ? null
              : Number(input.clientId) }
        : {}),
      ...(input.tripId !== undefined
        ? { tripId: Number(input.tripId) }
        : {}),
      ...(input.numSeats !== undefined
        ? { numSeats: this.normalizeSeats(input.numSeats) ?? undefined }
        : {}),
      ...(input.state !== undefined
        ? { state: String(input.state).toLowerCase() }
        : {}),
    });
    if (!updated) throw new ApiError(404, 'Reserva no encontrada');
    if (shouldCancel) {
      const warning = await sendBookingCancellationNotice(
        updated,
        'cancelada'
      );
      return { ...updated, ...(warning ? { warning } : {}) };
    }
    if (shouldConfirm) {
      const recipients = getBookingEmailRecipients(updated);
      if (!recipients.length) {
        return {
          ...updated,
          warning:
            'La reserva fue confirmada, pero no tiene un email de destino',
        };
      }
      try {
        await sendBookingConfirmationEmail(updated, recipients);
      } catch (error) {
        const responseCode =
          typeof error === 'object' &&
          error !== null &&
          'responseCode' in error
            ? Number(error.responseCode)
            : null;
        return {
          ...updated,
          warning: responseCode === 535
            ? 'La reserva fue confirmada, pero Gmail rechazo las credenciales SMTP. Configure una contrasena de aplicacion.'
            : 'La reserva fue confirmada, pero no se pudo enviar el email',
        };
      }
    }
    return updated;
  }

  async cancel(rawId: unknown, user?: { id: number; role: 'admin' | 'client' }) {
    const id = Number(rawId);
    if (!isPositiveInteger(id)) {
      throw new ApiError(400, 'El identificador de reserva no es valido');
    }
    const booking = await this.repository.findOne({ id });
    if (!booking) throw new ApiError(404, 'Reserva no encontrada');
    if (user?.role !== 'admin' && booking.clientId !== user?.id) {
      throw new ApiError(403, 'No puede cancelar una reserva de otro cliente');
    }
    if (booking.state === 'cancelled') {
      throw new ApiError(400, 'La reserva ya esta cancelada');
    }
    const trip = await this.tripRepository.findOne({ id: booking.tripId });
    if (!trip) throw new ApiError(404, 'El viaje seleccionado no existe');
    const departure =
      trip.scheduleType === 'specific' && trip.departureDate
        ? trip.departureDate
        : this.nextWeeklyDeparture(trip.dayOfWeek, trip.departureTime);
    const tripEnd =
      new Date(departure.getTime() +
        trip.journey.durationMinutes * 60000);
    if (tripEnd <= new Date()) {
      throw new ApiError(
        400,
        'La reserva no puede cancelarse porque el viaje ya finalizo'
      );
    }
    const updated = await this.repository.update({
      id,
      state: 'cancelled',
    });
    if (!updated) throw new ApiError(404, 'Reserva no encontrada');
    const warning = await sendBookingCancellationNotice(
      updated,
      'cancelada'
    );
    return { ...updated, ...(warning ? { warning } : {}) };
  }

  async seatsByTrips(rawIds: unknown) {
    if (!rawIds || !String(rawIds).trim()) {
      throw new ApiError(400, 'tripIds es obligatorio');
    }
    const tripIds = String(rawIds)
      .split(',')
      .map(Number)
      .filter(Number.isInteger);
    return { data: await this.repository.seatsByTripIds(tripIds) };
  }
}
