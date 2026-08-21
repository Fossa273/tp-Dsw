import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EditIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const WarnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const PerfilPage = () => {
  const { user, isAdmin, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    dni: user?.dni || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
  });

  const [passForm, setPassForm] = useState({
    password: '',
    confirm: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  // Seccion 1: datos personales
  const handleDatosSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.clientes.update(user.id, form);
      updateUser(form);
      showMessage('Datos actualizados correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Seccion 2: cambio de contraseña
  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (!passForm.password || !passForm.confirm) {
      showMessage('Complete ambos campos de contraseña', 'error');
      return;
    }
    if (passForm.password !== passForm.confirm) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }
    try {
      await api.clientes.update(user.id, { password: passForm.password });
      setPassForm({ password: '', confirm: '' });
      showMessage('Contraseña actualizada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Seccion 3: baja de la cuenta propia
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') {
      showMessage('Debe escribir ELIMINAR para confirmar', 'error');
      return;
    }
    try {
      await api.clientes.delete(user.id);
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
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="perfil-apellido">Apellido</label>
              <input
                id="perfil-apellido"
                name="apellido"
                placeholder="Apellido"
                value={form.apellido}
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
                name="telefono"
                placeholder="Telefono"
                value={form.telefono}
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
            <button type="submit" className="btn btn-primary">
              <EditIcon />
              Guardar cambios
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
              <input
                id="perfil-pass"
                name="password"
                type="password"
                placeholder="••••••••"
                value={passForm.password}
                onChange={handlePassChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="perfil-pass-confirm">Repetir contraseña</label>
              <input
                id="perfil-pass-confirm"
                name="confirm"
                type="password"
                placeholder="••••••••"
                value={passForm.confirm}
                onChange={handlePassChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <LockIcon />
              Cambiar contraseña
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

export default PerfilPage;
