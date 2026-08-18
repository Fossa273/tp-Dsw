const DESTINOS = [
  {
    id: 1,
    nombre: 'Bariloche',
    provincia: 'Rio Negro',
    precio: '$15.000',
    imagen: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    nombre: 'Mar del Plata',
    provincia: 'Buenos Aires',
    precio: '$8.000',
    imagen: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    nombre: 'Cordoba',
    provincia: 'Cordoba',
    precio: '$7.000',
    imagen: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    nombre: 'Mendoza',
    provincia: 'Mendoza',
    precio: '$9.000',
    imagen: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
];

const CardsDestinos = () => {
  return (
    <section className="destinos">
      <h2>Destinos populares</h2>
      <div className="destinos-grid">
        {DESTINOS.map((destino) => (
          <div key={destino.id} className="destino-card">
            <div
              className="destino-img"
              style={{ backgroundImage: `url(${destino.imagen})` }}
            />
            <div className="destino-info">
              <h3>{destino.nombre}</h3>
              <p className="destino-provincia">{destino.provincia}</p>
              <div className="destino-footer">
                <span className="destino-precio">{destino.precio}</span>
                <span className="destino-label">por persona</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CardsDestinos;
