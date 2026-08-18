import { useState } from 'react';

const UserMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="user-menu">
      <button className="user-icon" onClick={() => setOpen(!open)}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <strong>Mi Cuenta</strong>
          </div>
          <div className="user-dropdown-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Datos personales
          </div>
          <div className="user-dropdown-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Cerrar sesion
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
