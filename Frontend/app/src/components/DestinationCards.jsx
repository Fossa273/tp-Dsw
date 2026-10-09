import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { dayOfWeekName, formatDateOnly } from '../utils/format';

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-AR')}`;
}

function formatExpiry(dateStr) {
  return formatDateOnly(dateStr.slice(0, 10));
}

function formatSchedule(trip) {
  if (trip.scheduleType === 'specific' && trip.departureDate) {
    return `Fecha: ${formatDateOnly(trip.departureDate.slice(0, 10))}`;
  }
  return `Todos los ${dayOfWeekName(trip.dayOfWeek).toLowerCase()}`;
}

const DestinationCards = ({ onSelectPromotion }) => {
  const [promoted, setPromoted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trips.getPromoted()
      .then((res) => setPromoted(res.data || []))
      .catch(() => setPromoted([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || promoted.length === 0) return null;

  return (
    <section className="destinos">
      <h2>Promociones</h2>
      <div className="destinos-grid">
        {promoted.map((trip) => (
          <button
            key={trip.id}
            type="button"
            className="destino-card destino-card-button"
            onClick={() => onSelectPromotion(trip)}
          >
            <div className="destino-info">
              <h3>
                {trip.journey?.origin?.name || '?'} &rarr; {trip.journey?.destination?.name || '?'}
              </h3>
              <p className="destino-schedule">
                {formatSchedule(trip)}
              </p>
              {trip.promoExpiry && (
                <p className="destino-expiry">
                  Vence: {formatExpiry(trip.promoExpiry)}
                </p>
              )}
              <div className="destino-footer">
                <span className="destino-precio">
                  {formatPrice(trip.promoPrice)}
                  <small> por persona</small>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default DestinationCards;
