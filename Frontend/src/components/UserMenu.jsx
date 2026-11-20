import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserIcon = () => (
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
);

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const LoginIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const handleLogin = () => {
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="user-menu">
      <button className="user-icon" onClick={() => setOpen(!open)}>
        <UserIcon />
      </button>

      {open && (
        <>
          <div className="user-dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="user-dropdown">
            {user ? (
              <>
                <div className="user-dropdown-header">
                  <strong>{isAdmin ? 'Administrador' : 'Mi Cuenta'}</strong>
                  <span className="user-dropdown-email">{user.email}</span>
                </div>
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setOpen(false);
                    navigate('/profile');
                  }}
                >
                  <UserIcon />
                  Mis datos
                </div>
                {isAdmin && (
                  <div
                    className="user-dropdown-item"
                    onClick={() => {
                      setOpen(false);
                      navigate('/admin');
                    }}
                  >
                    <UserIcon />
                    Panel de administracion
                  </div>
                )}
                <div className="user-dropdown-item" onClick={handleLogout}>
                  <LogoutIcon />
                  Cerrar sesion
                </div>
              </>
            ) : (
              <>
                <div className="user-dropdown-header">
                  <strong>Sesion no iniciada</strong>
                </div>
                <div className="user-dropdown-item" onClick={handleLogin}>
                  <LoginIcon />
                  Iniciar sesion / Registrarse
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;