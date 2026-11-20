const AboutUs = () => {
  return (
    <section className="quienes-somos">
      <div className="qs-content">
        <h2>Quienes somos</h2>
        <p>
          Somos una empresa dedicada a brindar servicios de transporte y
          reservas de viajes en todo el pais. Con mas de 10 años de experiencia,
          conectamos pasajeros con los mejores destinos ofreciendo seguridad,
          comodidad y los mejores precios.
        </p>
        <div className="qs-stats">
          <div className="qs-stat">
            <span className="qs-stat-number">50+</span>
            <span className="qs-stat-label">Destinos</span>
          </div>
          <div className="qs-stat">
            <span className="qs-stat-number">10K+</span>
            <span className="qs-stat-label">Viajeros</span>
          </div>
          <div className="qs-stat">
            <span className="qs-stat-number">100+</span>
            <span className="qs-stat-label">Vehiculos</span>
          </div>
          <div className="qs-stat">
            <span className="qs-stat-number">10+</span>
            <span className="qs-stat-label">Años</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;