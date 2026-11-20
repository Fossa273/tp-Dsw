import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { api } from '../services/api';
import { UserIcon, EditIcon, LockIcon, WarnIcon, EyeIcon, EyeOffIcon } from '../components/icons';

const ProfilePage = () => {
  const { user, isAdmin, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dni: user?.dni || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passForm, setPassForm] = useState({
    password: '',
    confirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const msgTimer = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleDatosSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (String(form.email).trim().toLowerCase() === ADMIN_EMAIL && !isAdmin) {
      setSubmitting(true);
      try {
        showMessage('No se puede usar el email del administrador', 'error');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    try {
      await api.clients.update(user.id, form);
      updateUser(form);
      showMessage('Datos actualizados correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Seccion 2: cambio de contraseña
  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!passForm.password || !passForm.confirm) {
      showMessage('Complete ambos campos de contraseña', 'error');
      return;
    }
    if (passForm.password !== passForm.confirm) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.clients.update(user.id, { password: passForm.password });
      setPassForm({ password: '', confirm: '' });
      showMessage('Contraseña actualizada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Seccion 3: baja de la cuenta propia
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') {
      showMessage('Debe escribir ELIMINAR para confirmar', 'error');
      return;
    }
    try {
      await api.clients.delete(user.id);
      await logout();
      navigate('/');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="crud-page">
      <h1>Mis Datos</h1>

      {msg && (
        <div
          className={`crud-message ${
            msgType === 'error' ? 'msg-error' : 'msg-success'
          }`}
        >
          {msg}
        </div>
      )}

      {/* SECCION 1: DATOS PERSONALES */}
      <section className="profile-section">
        <div className="profile-section-header">
          <UserIcon />
          <div>
            <h2>Datos personales</h2>
            <p className="profile-section-desc">
              Modifique sus datos y guarde los cambios
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleDatosSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-nombre">Nombre</label>
              <input
                id="perfil-nombre"
                name="firstName"
                placeholder="Nombre"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="perfil-apellido">Apellido</label>
              <input
                id="perfil-apellido"
                name="lastName"
                placeholder="Apellido"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-email">Email</label>
              <input
                id="perfil-email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="perfil-telefono">Telefono</label>
              <input
                id="perfil-telefono"
                name="phone"
                placeholder="Telefono"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-dni">DNI</label>
              <input
                id="perfil-dni"
                name="dni"
                placeholder="DNI"
                value={form.dni}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <EditIcon />
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>

      {/* SECCION 2: CONTRASEÑA */}
      <section className="profile-section">
        <div className="profile-section-header">
          <LockIcon />
          <div>
            <h2>Seguridad</h2>
            <p className="profile-section-desc">
              Cambie su contraseña ingresandola dos veces para confirmarla
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handlePassSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-pass">Nueva contraseña</label>
              <div className="auth-input-wrapper">
                <input
                  id="perfil-pass"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passForm.password}
                  onChange={handlePassChange}
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
            <div className="form-group">
              <label htmlFor="perfil-pass-confirm">Repetir contraseña</label>
              <div className="auth-input-wrapper">
                <input
                  id="perfil-pass-confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passForm.confirm}
                  onChange={handlePassChange}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <LockIcon />
              {submitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </section>

      {/* SECCION 3: DANGER ZONE (no disponible para el admin) */}
      {!isAdmin && (
        <section className="profile-section danger-zone">
          <div className="profile-section-header danger-header">
            <WarnIcon />
            <div>
              <h2>Danger Zone</h2>
              <p className="profile-section-desc">
                Eliminar su cuenta es una accion permanente. Se realizara una
                baja logica: la cuenta quedara inactiva pero no se eliminaran
                los datos fisicamente.
              </p>
            </div>
          </div>

          <div className="profile-form danger-form">
            <div className="danger-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Para confirmar la eliminacion de su cuenta, escriba{' '}
                <strong>ELIMINAR</strong> en el campo de abajo.
              </span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder='Escriba "ELIMINAR" para confirmar'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'ELIMINAR'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProfilePage;
