const DESTINATIONS = [
  {
    id: 1,
    name: 'Bariloche',
    province: 'Rio Negro',
    price: '$15.000',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'Mar del Plata',
    province: 'Buenos Aires',
    price: '$8.000',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    name: 'Cordoba',
    province: 'Cordoba',
    price: '$7.000',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    name: 'Mendoza',
    province: 'Mendoza',
    price: '$9.000',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
];

const DestinationCards = () => {
  return (
    <section className="destinos">
      <h2>Destinos populares</h2>
      <div className="destinos-grid">
        {DESTINATIONS.map((destination) => (
          <div key={destination.id} className="destino-card">
            <div
              className="destino-img"
              style={{ backgroundImage: `url(${destination.image})` }}
            />
            <div className="destino-info">
              <h3>{destination.name}</h3>
              <p className="destino-provincia">{destination.province}</p>
              <div className="destino-footer">
                <span className="destino-precio">{destination.price}</span>
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