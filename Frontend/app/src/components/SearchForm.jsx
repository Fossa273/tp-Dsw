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
      const res = await api.trips.getAll();
      const trips = res.data || [];
      const filtered = trips.filter((trip) => {
        const matchOrigin =
          !origin ||
          String(trip.journey?.originId) === String(origin) ||
          trip.journey?.origin?.name === origin;
        const matchDest =
          !destination ||
          String(trip.journey?.destinationId) === String(destination) ||
          trip.journey?.destination?.name === destination;
        const matchDate =
          !date ||
          new Date(trip.departureDate).toISOString().slice(0, 10) === date;
        const matchPassengers =
          !passengers ||
          (trip.vehicle?.maxCapacity ?? 0) >= Number(passengers);
        return matchOrigin && matchDest && matchDate && matchPassengers;
      });
      setResults(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingResults(false);
    }
  };

  const sorted = [...localities].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'es')
  );

  return (
    <section className="busqueda">
      <h2>Busca tu viaje</h2>
      <form className="busqueda-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="origen">Origen</label>
          <select
            id="origen"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="">Todos los origenes</option>
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
            <option value="">Todos los destinos</option>
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

        <button type="submit" className="btn btn-primary btn-buscar" disabled={loadingResults}>
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
        <p className="empty-msg" style={{ color: '#e74c3c', marginTop: '1rem' }}>
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
                      Salida: {formatDate(trip.departureDate)}
                      {trip.arrivalDate &&
                        ` | Llegada: ${formatDate(trip.arrivalDate)}`}
                    </p>
                    <div className="destino-footer">
                      <span className="destino-label">
                        {trip.vehicle?.maxCapacity ?? '?'} asientos disponibles
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
