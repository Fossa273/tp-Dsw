const ADMIN_ITEMS = [
  {
    key: 'clientes',
    title: 'Clientes',
    description: 'Gestionar datos de pasajeros y cuentas de usuario.',
    iconClass: 'clientes',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'vehiculos',
    title: 'Vehiculos',
    description: 'Administrar la flota de colectivos y unidades disponibles.',
    iconClass: 'vehiculos',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z" />
        <circle cx="7.5" cy="17" r="1.5" />
        <circle cx="16.5" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    key: 'localidades',
    title: 'Localidades',
    description: 'ABM de localidades y puntos de partida/destino.',
    iconClass: 'localidades',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: 'provincias',
    title: 'Provincias',
    description: 'Administrar provincias y regiones del pais.',
    iconClass: 'provincias',
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
