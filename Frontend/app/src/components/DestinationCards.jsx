import { useEffect, useState } from 'react';
import { api } from '../services/api';

const DESTINATION_IMAGES = [
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
];

function formatPrice(value) {
  return `$${Math.round(value).toLocaleString('es-AR')}`;
}

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DestinationCards = () => {
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
        {promoted.map((trip, idx) => (
          <div key={trip.id} className="destino-card">
            <div
              className="destino-img"
              style={{ backgroundImage: `url(${DESTINATION_IMAGES[idx % DESTINATION_IMAGES.length]})` }}
            />
            <div className="destino-info">
              <h3>
                {trip.journey?.origin?.name || '?'} &rarr; {trip.journey?.destination?.name || '?'}
              </h3>
              <p className="destino-provincia">
                {trip.journey?.destination?.province?.name || ''}
              </p>
              {trip.promoExpiry && (
                <p className="destino-expiry">
                  Vence: {formatExpiry(trip.promoExpiry)}
                </p>
              )}
              <div className="destino-footer">
                <span className="destino-precio">{formatPrice(trip.journey?.distanceKm * 100 || 0)}</span>
                <span className="destino-label">por persona</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DestinationCards;
