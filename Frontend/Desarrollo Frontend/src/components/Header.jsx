import { useState } from 'react';
import UserMenu from './UserMenu';

const Header = ({ currentPage, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { key: 'home', label: 'Inicio' },
    { key: 'clientes', label: 'Clientes' },
    { key: 'localidades', label: 'Localidades' },
    { key: 'provincias', label: 'Provincias' },
    { key: 'vehiculos', label: 'Vehiculos' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo" onClick={() => onNavigate('home')}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>EmpresaViaje</span>
        </div>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <button
              key={link.key}
              className={`nav-link ${currentPage === link.key ? 'active' : ''}`}
              onClick={() => {
                onNavigate(link.key);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          <UserMenu />
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
