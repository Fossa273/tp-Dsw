import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateOnly } from '../utils/format';

function nextDateForDay(dayOfWeek) {
  const date = new Date();
  const daysUntil = (Number(dayOfWeek) - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  if (daysUntil === 0) date.setDate(date.getDate() + 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isoToDisplayDate(value) {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function displayToIsoDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T12:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return '';
  }
  return `${year}-${month}-${day}`;
}

const SearchForm = ({ selectedPromotion }) => {
  const { user } = useAuth();
  const [localities, setLocalities] = useState([]);
  const [origin, setOrigin] = useState(() =>
    String(selectedPromotion?.journey?.origin?.id || ''),
  );
  const [destination, setDestination] = useState(() =>
    String(selectedPromotion?.journey?.destination?.id || ''),
  );
  const [date, setDate] = useState(() => {
    if (
      selectedPromotion?.scheduleType === 'specific' &&
      selectedPromotion.departureDate
    ) {
      return new Date(selectedPromotion.departureDate).toISOString().slice(0, 10);
    }
    return selectedPromotion ? nextDateForDay(selectedPromotion.dayOfWeek) : '';
  });
  const [dateInput, setDateInput] = useState(() => {
    if (
      selectedPromotion?.scheduleType === 'specific' &&
      selectedPromotion.departureDate
    ) {
      return isoToDisplayDate(
        new Date(selectedPromotion.departureDate).toISOString().slice(0, 10),
      );
    }
    return selectedPromotion
      ? isoToDisplayDate(nextDateForDay(selectedPromotion.dayOfWeek))
      : '';
  });
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [bookingTrip, setBookingTrip] = useState(null);
  const [passengerForms, setPassengerForms] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const searchFormRef = useRef(null);
  const datePickerRef = useRef(null);

  useEffect(() => {
    if (!selectedPromotion) return;
    document.getElementById('trip-search')?.scrollIntoView({ behavior: 'smooth' });
    const timer = setTimeout(() => searchFormRef.current?.requestSubmit(), 0);
    return () => clearTimeout(timer);
  }, [selectedPromotion]);

  useEffect(() => {
    const controller = new AbortController();
    api.localities
      .getAll()
      .then((res) => setLocalities(res.data || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingResults(true);
    setError(null);
    setResults(null);
    try {
      if (!origin || !destination || !date) {
        throw new Error('Selecciona origen, destino y fecha para buscar');
      }
      const tripsRes = await api.trips.search({
        originId: origin,
        destinationId: destination,
        date,
      });
      const trips = tripsRes.data || [];
      const reservedSeats = trips.length
        ? (await api.bookings.seatsByTrips(trips.map((trip) => trip.id))).data || {}
        : {};
      const selectedDate = new Date(`${date}T12:00:00`);
      const remainingSeats = (trip) => {
        return Math.max(
          0,
          Number(trip.vehicle?.maxCapacity || 0) - Number(reservedSeats[trip.id] || 0),
        );
      };
      const filtered = trips.filter((trip) => {
        if (selectedPromotion && trip.id !== selectedPromotion.id) return false;
        const specificDate =
          trip.scheduleType === 'specific' && trip.departureDate
            ? new Date(trip.departureDate)
            : null;
        const matchDate = specificDate
          ? specificDate.toISOString().slice(0, 10) === date
          : Number(trip.dayOfWeek) === selectedDate.getDay();

        if (trip.active === 0 || (specificDate && specificDate < new Date())) return false;

        const matchPassengers = remainingSeats(trip) >= Number(passengers);
        return matchDate && matchPassengers;
      });
      setResults(
        filtered.map((trip) => ({
          ...trip,
          availableSeats: remainingSeats(trip),
          searchDate: date,
        })),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingResults(false);
    }
  };

  const startBooking = (trip) => {
    setBookingTrip(trip);
    setBookingError(null);
    setBookingSuccess(null);
    setFieldErrors({});
    setPassengerForms(
      Array.from({ length: Number(passengers) }, (_, index) =>
        index === 0 && user
          ? {
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              dni: user.dni || '',
              phone: user.phone || '',
              email: user.email || '',
            }
          : { firstName: '', lastName: '', dni: '', phone: '', email: '' },
      ),
    );
  };

  const handleBookingChange = (index, e) => {
    setPassengerForms((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index
          ? { ...passenger, [e.target.name]: e.target.value }
          : passenger,
      ),
    );
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`${index}.${e.target.name}`];
      return next;
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingTrip || bookingLoading) return;
    const errors = {};
    passengerForms.forEach((passenger, index) => {
      ['firstName', 'lastName', 'dni', 'phone', 'email'].forEach((field) => {
        if (!String(passenger[field] || '').trim()) {
          errors[`${index}.${field}`] = 'Este campo es obligatorio.';
        }
      });
      if (
        passenger.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email.trim())
      ) {
        errors[`${index}.email`] = 'Ingresa un email valido.';
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const payload = {
        clientId: user?.id,
        tripId: bookingTrip.id,
        numSeats: Number(passengers),
        passengers: passengerForms,
      };
      const response = await api.bookings.create(payload);
      setBookingSuccess(response.id ? `Reserva #${response.id} creada correctamente.` : 'Reserva creada correctamente.');
      setBookingTrip(null);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const sorted = [...localities].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'es'),
  );

  return (
    <section className="busqueda" id="trip-search">
      <h2>Busca tu viaje</h2>
      {selectedPromotion && (
        <p className="booking-verification" role="status">
          Promocion seleccionada: {selectedPromotion.journey?.origin?.name} &rarr;{' '}
          {selectedPromotion.journey?.destination?.name}. Revisa la fecha y presiona Buscar para reservarla.
        </p>
      )}
      <form ref={searchFormRef} className="busqueda-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="origen">Origen</label>
          <select
            id="origen"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="">Selecciona origen</option>
            {sorted.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="destino">Destino</label>
          <select
            id="destino"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Selecciona destino</option>
            {sorted.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <div className="date-picker-field">
            <input
              type="text"
              id="fecha"
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              value={dateInput}
              onChange={(e) => {
                const value = e.target.value;
                setDateInput(value);
                setDate(displayToIsoDate(value));
              }}
              required
            />
            <button
              type="button"
              className="date-picker-button"
              aria-label="Abrir calendario"
              onClick={() => {
                if (typeof datePickerRef.current?.showPicker === 'function') {
                  datePickerRef.current.showPicker();
                } else {
                  datePickerRef.current?.click();
                }
              }}
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <input
              ref={datePickerRef}
              className="date-picker-native"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              tabIndex="-1"
              aria-hidden="true"
              onChange={(e) => {
                setDate(e.target.value);
                setDateInput(isoToDisplayDate(e.target.value));
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pasajeros">Pasajeros</label>
          <input
            type="number"
            id="pasajeros"
            min="1"
            max="60"
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-buscar"
          disabled={loadingResults}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {loadingResults ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <p
          className="empty-msg"
          style={{ color: '#e74c3c', marginTop: '1rem' }}
        >
          Error: {error}
        </p>
      )}

      {results !== null && (
        <div className="search-results" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>
            {results.length === 0
              ? 'No se encontraron viajes disponibles.'
              : `${results.length} viaje(s) encontrado(s)`}
          </h3>
          {results.length > 0 && (
            <div className="destinos-grid">
              {results.map((trip) => (
                <div key={trip.id} className="destino-card search-result-card">
                  <div className="destino-info">
                    <h4 className="search-result-route">
                      {trip.journey?.origin?.name || '?'} &rarr;{' '}
                      {trip.journey?.destination?.name || '?'}
                    </h4>
                    <div className="search-result-details">
                      <p>
                        <span>Salida</span>
                      {trip.scheduleType === 'specific'
                        ? formatDate(trip.departureDate)
                        : `${formatDateOnly(trip.searchDate)} ${trip.departureTime || ''}`}
                      </p>
                      {trip.arrivalDate && (
                        <p>
                          <span>Llegada</span>
                          {formatDate(trip.arrivalDate)}
                        </p>
                      )}
                    </div>
                    <div className="search-result-price">
                      <span>Precio por persona</span>
                      <strong>${Number(trip.pricePerPerson || 0).toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="destino-footer search-result-actions">
                      <span className="destino-label">
                        {trip.availableSeats} asientos disponibles
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => startBooking(trip)}
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {bookingSuccess && <p className="booking-feedback booking-success">{bookingSuccess}</p>}
          {bookingTrip && (
            <form className="booking-confirmation" onSubmit={handleBookingSubmit} noValidate>
              <div className="booking-confirmation-header">
                <div>
                  <h3>Confirmar reserva</h3>
                  <p>
                    {bookingTrip.journey?.origin?.name} &rarr; {bookingTrip.journey?.destination?.name}
                    {' | '}{passengers} {Number(passengers) === 1 ? 'asiento' : 'asientos'}
                  </p>
                </div>
                <button
                  type="button"
                  className="booking-close"
                  onClick={() => setBookingTrip(null)}
                  aria-label="Cerrar confirmacion de reserva"
                  title="Cerrar"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              {user ? (
                <p className="booking-verification" role="status">
                  Revisa los datos de cada pasajero antes de confirmar la reserva.
                  La reserva quedara asociada a <strong>{user.email}</strong>.
                </p>
              ) : (
                <p className="booking-verification booking-verification-guest" role="status">
                  Estas reservando como invitado. Verifica los datos de cada pasajero antes de confirmar la reserva.
                </p>
              )}
              <div className="booking-passengers">
                {passengerForms.map((passenger, index) => (
                  <fieldset className="booking-passenger" key={index}>
                    <legend>Pasajero {index + 1}</legend>
                    <div className="booking-fields">
                      {[
                        ['firstName', 'Nombre', 'text'],
                        ['lastName', 'Apellido', 'text'],
                        ['dni', 'DNI', 'text'],
                        ['phone', 'Telefono', 'tel'],
                        ['email', 'Email', 'email'],
                      ].map(([name, label, type]) => {
                        const errorKey = `${index}.${name}`;
                        return (
                          <div className="form-group" key={name}>
                            <label htmlFor={`booking-${index}-${name}`}>{label}</label>
                            <input
                              id={`booking-${index}-${name}`}
                              name={name}
                              type={type}
                              value={passenger[name]}
                              onChange={(event) => handleBookingChange(index, event)}
                              aria-invalid={Boolean(fieldErrors[errorKey])}
                            />
                            {fieldErrors[errorKey] && (
                              <span className="field-error">{fieldErrors[errorKey]}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              {bookingError && <p className="booking-feedback booking-error">{bookingError}</p>}
              <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                {bookingLoading ? 'Confirmando...' : 'Confirmar reserva'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchForm;
