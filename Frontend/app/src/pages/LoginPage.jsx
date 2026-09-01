import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODES = {
  login: {
    title: 'Iniciar sesion',
    subtitle: 'Ingrese con su email y contraseña',
    submitLabel: 'Ingresar',
  },
  register: {
    title: 'Crear cuenta',
    subtitle: 'Complete sus datos para registrarse',
    submitLabel: 'Registrarme',
  },
  reset: {
    title: 'Recuperar contraseña',
    subtitle:
      'Ingrese su email y la nueva contraseña (modo prueba, sin verificacion)',
    submitLabel: 'Cambiar contraseña',
  },
};

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 6L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, resetPassword } = useAuth();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
  });
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const msgTimer = useRef(null);
  const [loading, setLoading] = useState(false);

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  };

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(form.email, form.password);
        // The administrator (client id 0) goes directly to the admin panel
        navigate(String(loggedUser?.id) === '0' ? '/admin' : '/');
      } else if (mode === 'register') {
        await register({
          firstName: form.firstName,
          lastName: form.lastName,
          dni: form.dni,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
        showMessage(
          'Cuenta creada correctamente. Ya puede iniciar sesion.',
          'success'
        );
        setForm((prev) => ({
          ...prev,
          password: '',
          firstName: '',
          lastName: '',
          dni: '',
          phone: '',
        }));
        setTimeout(() => switchMode('login'), 2000);
      } else {
        await resetPassword(form.email, form.password);
        showMessage('Contrasena actualizada correctamente.', 'success');
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const config = MODES[mode];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>

        {msg && (
          <div
            className={`crud-message ${
              msgType === 'error' ? 'msg-error' : 'msg-success'
            }`}
          >
            {msg}
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="auth-firstName">Nombre</label>
                  <input
                    id="auth-firstName"
                    name="firstName"
                    placeholder="Nombre"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-lastName">Apellido</label>
                  <input
                    id="auth-lastName"
                    name="lastName"
                    placeholder="Apellido"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group auth-input-group">
                  <label htmlFor="auth-phone">Telefono</label>
                  <input
                    id="auth-phone"
                    name="phone"
                    placeholder="Telefono"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group auth-input-group">
                  <label htmlFor="auth-dni">DNI</label>
                  <input
                    id="auth-dni"
                    name="dni"
                    placeholder="DNI"
                    value={form.dni}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group auth-input-group">
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrapper">
              <MailIcon />
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group auth-input-group">
            <label htmlFor="auth-password">
              {mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
            </label>
            <div className="auth-input-wrapper">
              <LockIcon />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <UserIcon />
            {loading ? 'Procesando...' : config.submitLabel}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode('reset')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {mode === 'reset' && (
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode('login')}
          >
            Volver a iniciar sesion
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;