const Hero = ({ onNavigate }) => {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1>RutaBus</h1>
        <p className="hero-subtitle">
          Tu viaje comienza aqui. Reserva, gestiona y disfruta de los mejores
          destinos con la mejor flota de vehiculos.
        </p>

        <div className="hero-buttons">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('vehiculos')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Inicia tu viaje
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('clientes')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Gestiona tus reservas
          </button>
          <button
            className="btn btn-accent"
            onClick={() => onNavigate('localidades')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Reserva tu viaje
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
