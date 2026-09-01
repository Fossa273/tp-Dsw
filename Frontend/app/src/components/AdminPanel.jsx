const ADMIN_ITEMS = [
  {
    key: 'clients',
    title: 'Clientes',
    description: 'Gestionar datos de pasajeros y cuentas de usuario.',
    iconClass: 'clients',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'vehicles',
    title: 'Vehiculos',
    description: 'Administrar la flota de colectivos y unidades disponibles.',
    iconClass: 'vehicles',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    key: 'drivers',
    title: 'Conductores',
    description: 'Gestionar el personal de choferes y su estado de actividad.',
    iconClass: 'drivers',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21v-1a6.5 6.5 0 0113 0v1" />
      </svg>
    ),
  },
  {
    key: 'localities',
    title: 'Localidades',
    description: 'ABM de localidades y puntos de partida/destino.',
    iconClass: 'localities',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: 'journeys',
    title: 'Trayectos',
    description: 'Definir recorridos entre localidades de origen y destino.',
    iconClass: 'trayectos',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="5" cy="18" r="2.5" />
        <circle cx="19" cy="6" r="2.5" />
        <path d="M6.5 17.5L17.5 6.5" />
        <path d="M5 15.5v-3a5 5 0 015-5h2.5" />
        <path d="M19 8.5v3a5 5 0 01-5 5H11.5" />
      </svg>
    ),
  },
  {
    key: 'trips',
    title: 'Viajes',
    description: 'Programar servicios: trayecto, conductor, vehiculo y horarios.',
    iconClass: 'viajes',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    key: 'bookings',
    title: 'Reservas',
    description: 'Gestionar las reservas de asientos de los pasajeros.',
    iconClass: 'reservas',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 18v-6a8 8 0 0116 0v6" />
        <path d="M2 18h20" />
        <path d="M18 18l-.5 3" />
        <path d="M6 18l.5 3" />
      </svg>
    ),
  },
  {
    key: 'provinces',
    title: 'Provincias',
    description: 'Administrar provincias y regiones del pais.',
    iconClass: 'provinces',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

const AdminPanel = ({ onNavigate }) => {
  return (
    <section className="admin-section" id="panel-admin">
      <h2>Panel de administracion</h2>
      <p className="admin-subtitle">
        Gestiona todos los modulos del sistema desde un solo lugar
      </p>
      <div className="admin-grid">
        {ADMIN_ITEMS.map((item) => (
          <div
            key={item.key}
            className="admin-card"
            onClick={() => onNavigate(item.key)}
          >
            <div className={`admin-card-icon ${item.iconClass}`}>
              {item.icon}
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminPanel;