import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon } from '../components/icons';

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
  const attemptsRef = useRef(0);
  const lockoutRef = useRef(null);

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
    if (loading) return;
    if (mode === 'login' && lockoutRef.current) {
      showMessage(`Demasiados intentos. Intente de nuevo en ${lockoutRef.current}s`, 'error');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(form.email, form.password);
        attemptsRef.current = 0;
        const isAdminUser =
          !!loggedUser?.email &&
          String(loggedUser.email).trim().toLowerCase() === ADMIN_EMAIL;
        navigate(isAdminUser ? '/admin' : '/');
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
      if (mode === 'login') {
        attemptsRef.current += 1;
        if (attemptsRef.current >= 5) {
          let remaining = 30;
          lockoutRef.current = remaining;
          const interval = setInterval(() => {
            remaining -= 1;
            lockoutRef.current = remaining > 0 ? remaining : null;
            if (remaining <= 0) {
              clearInterval(interval);
              attemptsRef.current = 0;
            }
          }, 1000);
        }
      }
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