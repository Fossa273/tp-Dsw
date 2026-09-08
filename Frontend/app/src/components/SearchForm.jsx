import { useEffect, useState } from 'react';
import { api } from '../services/api';

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SearchForm = () => {
  const [localities, setLocalities] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.localities
      .getAll()
      .then((res) => setLocalities(res.data || []))
      .catch(() => {});
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
      const [tripsRes, bookingsRes] = await Promise.all([
        api.trips.getAll(),
        api.bookings.getAll(),
      ]);
      const trips = tripsRes.data || [];
      const bookings = bookingsRes.data || [];
      const selectedDate = new Date(`${date}T12:00:00`);
      const remainingSeats = (trip) => {
        const reserved = bookings
          .filter(
            (booking) =>
              booking.tripId === trip.id && booking.state !== 'cancelled',
          )
          .reduce((sum, booking) => sum + Number(booking.numSeats || 0), 0);
        return Math.max(0, Number(trip.vehicle?.maxCapacity || 0) - reserved);
      };
      const filtered = trips.filter((trip) => {
        const matchOrigin = String(trip.journey?.originId) === String(origin);
        const matchDest =
          String(trip.journey?.destinationId) === String(destination);
        const specificDate =
          trip.scheduleType === 'specific' && trip.departureDate
            ? new Date(trip.departureDate)
            : null;
        const matchDate = specificDate
          ? specificDate.toISOString().slice(0, 10) === date
          : Number(trip.dayOfWeek) === selectedDate.getDay();
        const matchPassengers = remainingSeats(trip) >= Number(passengers);
        return matchOrigin && matchDest && matchDate && matchPassengers;
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SearchForm;
