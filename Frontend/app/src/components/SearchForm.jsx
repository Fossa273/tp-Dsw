import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const SearchForm = () => {
  const { user } = useAuth();
  const [localities, setLocalities] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [bookingTrip, setBookingTrip] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
  });
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

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
    if (user) {
      setBookingForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dni: user.dni || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    } else {
      setBookingForm({ firstName: '', lastName: '', dni: '', phone: '', email: '' });
    }
  };

  const handleBookingChange = (e) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingTrip || bookingLoading) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const payload = {
        clientId: user?.id,
        tripId: bookingTrip.id,
        numSeats: Number(passengers),
        ...(!user && {
          passengerFirstName: bookingForm.firstName,
          passengerLastName: bookingForm.lastName,
          passengerDni: bookingForm.dni,
          passengerPhone: bookingForm.phone,
          passengerEmail: bookingForm.email,
        }),
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
      <form className="busqueda-form" onSubmit={handleSubmit}>
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
          <input
            type="date"
            id="fecha"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
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
                <div key={trip.id} className="destino-card">
                  <div className="destino-info">
                    <h4 style={{ margin: '0 0 0.25rem' }}>
                      {trip.journey?.origin?.name || '?'} &rarr;{' '}
                      {trip.journey?.destination?.name || '?'}
                    </h4>
                    <p className="destino-provincia">
                      Salida:{' '}
                      {trip.scheduleType === 'specific'
                        ? formatDate(trip.departureDate)
                        : `${trip.searchDate} ${trip.departureTime || ''}`}
                      {trip.arrivalDate &&
                        ` | Llegada: ${formatDate(trip.arrivalDate)}`}
                    </p>
                    <div className="destino-footer">
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
            <form className="booking-confirmation" onSubmit={handleBookingSubmit}>
              <div className="booking-confirmation-header">
                <div>
                  <h3>Confirmar reserva</h3>
                  <p>
                    {bookingTrip.journey?.origin?.name} &rarr; {bookingTrip.journey?.destination?.name}
                    {' | '}{passengers} {Number(passengers) === 1 ? 'asiento' : 'asientos'}
                  </p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBookingTrip(null)}>
                  Cerrar
                </button>
              </div>
              {user ? (
                <p className="booking-verification">
                  Vas a reservar como <strong>{user.firstName} {user.lastName}</strong> ({user.email}). Verifica los datos antes de confirmar.
                </p>
              ) : (
                <>
                  <p className="booking-verification">Completa tus datos para asociarlos a la reserva.</p>
                  <div className="booking-fields">
                    {[
                      ['firstName', 'Nombre', 'text'],
                      ['lastName', 'Apellido', 'text'],
                      ['dni', 'DNI', 'text'],
                      ['phone', 'Telefono', 'tel'],
                      ['email', 'Email', 'email'],
                    ].map(([name, label, type]) => (
                      <div className="form-group" key={name}>
                        <label htmlFor={`booking-${name}`}>{label}</label>
                        <input id={`booking-${name}`} name={name} type={type} value={bookingForm[name]} onChange={handleBookingChange} required />
                      </div>
                    ))}
                  </div>
                </>
              )}
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
