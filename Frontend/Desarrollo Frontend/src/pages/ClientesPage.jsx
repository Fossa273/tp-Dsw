import { useState } from 'react';
import { useClientes } from '../hooks/useClientes';
import { api } from '../services/api';

const ClientesPage = () => {
  const { clientes, loading, error, create, update, remove, refetch } =
    useClientes();

  const [showBajas, setShowBajas] = useState(false);
  const [bajas, setBajas] = useState([]);
  const [loadingBajas, setLoadingBajas] = useState(false);

  const fetchBajas = async () => {
    setLoadingBajas(true);
    try {
      const res = await api.clientes.getInactive();
      setBajas(res.data || []);
    } catch {
      setBajas([]);
    } finally {
      setLoadingBajas(false);
    }
  };

  const handleToggleBajas = () => {
    const nuevoEstado = !showBajas;
    setShowBajas(nuevoEstado);
    if (nuevoEstado) {
      fetchBajas();
    }
  };

  // Da de alta nuevamente a un cliente con baja logica
  const handleAlta = async (id) => {
    try {
      await api.clientes.reactivate(id);
      showMessage('Cliente dado de alta correctamente');
      await Promise.all([fetchBajas(), refetch()]);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
  });

  const [selectedId, setSelectedId] = useState('');
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
  });

  const [deleteId, setDeleteId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await create(registerForm);
      setRegisterForm({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        password: '',
      });
      showMessage('Cliente registrado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleSelectClient = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const cliente = clientes.find((c) => String(c.id) === id);
    if (cliente) {
      setEditForm({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        dni: cliente.dni || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
      });
    } else {
      setEditForm({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
      });
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await update(selectedId, editForm);
      showMessage('Datos actualizados correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteConfirm !== 'ELIMINAR') {
      showMessage('Debe escribir ELIMINAR para confirmar', 'error');
      return;
    }
    try {
      await remove(deleteId);
      setDeleteId('');
      setDeleteConfirm('');
      showMessage('Cuenta dada de baja correctamente');
      if (showBajas) {
        fetchBajas();
      }
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Clientes</h1>

      {msg && (
        <div className={`crud-message ${msgType === 'error' ? 'msg-error' : 'msg-success'}`}>
          {msg}
        </div>
      )}

      {/* SECCION 1: REGISTRO */}
      <section className="profile-section">
        <div className="profile-section-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <div>
            <h2>Registro de cliente</h2>
            <p className="profile-section-desc">
              Complete el formulario para registrar un nuevo cliente en el sistema
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleRegisterSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-nombre">Nombre</label>
              <input
                id="reg-nombre"
                name="nombre"
                placeholder="Nombre"
                value={registerForm.nombre}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-apellido">Apellido</label>
              <input
                id="reg-apellido"
                name="apellido"
                placeholder="Apellido"
                value={registerForm.apellido}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={registerForm.email}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-telefono">Telefono</label>
              <input
                id="reg-telefono"
                name="telefono"
                placeholder="Telefono"
                value={registerForm.telefono}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-dni">DNI</label>
              <input
                id="reg-dni"
                name="dni"
                placeholder="DNI"
                value={registerForm.dni}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Contraseña</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                placeholder="Contraseña del cliente"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Registrarse
            </button>
          </div>
        </form>
      </section>

      {/* SECCION 2: DATOS PERSONALES */}
      <section className="profile-section">
        <div className="profile-section-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <div>
            <h2>Datos personales</h2>
            <p className="profile-section-desc">
              Seleccione un cliente para ver y modificar sus datos
            </p>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="select-cliente">Seleccionar cliente</label>
              <select
                id="select-cliente"
                value={selectedId}
                onChange={handleSelectClient}
              >
                <option value="">-- Elegir cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido} (ID: {c.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedId && (
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-nombre">Nombre</label>
                  <input
                    id="edit-nombre"
                    name="nombre"
                    placeholder="Nombre"
                    value={editForm.nombre}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-apellido">Apellido</label>
                  <input
                    id="edit-apellido"
                    name="apellido"
                    placeholder="Apellido"
                    value={editForm.apellido}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-telefono">Telefono</label>
                  <input
                    id="edit-telefono"
                    name="telefono"
                    placeholder="Telefono"
                    value={editForm.telefono}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-dni">DNI</label>
                  <input
                    id="edit-dni"
                    name="dni"
                    placeholder="DNI"
                    value={editForm.dni}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* SECCION 3: DANGER ZONE */}
      <section className="profile-section danger-zone">
        <div className="profile-section-header danger-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h2>Danger Zone</h2>
            <p className="profile-section-desc">
              Dar de baja una cuenta es una accion permanente. Se realizara una
              baja logica: la cuenta quedara inactiva pero no se eliminaran los
              datos fisicamente.
            </p>
          </div>
        </div>

        <div className="profile-form danger-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="delete-cliente">Seleccionar cliente</label>
              <select
                id="delete-cliente"
                value={deleteId}
                onChange={(e) => {
                  setDeleteId(e.target.value);
                  setDeleteConfirm('');
                }}
              >
                <option value="">-- Elegir cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido} (ID: {c.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {deleteId && (
            <>
              <div className="danger-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  Para confirmar la baja, escriba <strong>ELIMINAR</strong> en el
                  campo de abajo.
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
                  onClick={handleDelete}
                  disabled={deleteConfirm !== 'ELIMINAR'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Dar de baja cuenta
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* LISTADO */}
      <section className="profile-section">
        <div className="profile-section-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div>
            <h2>Listado de clientes</h2>
            <p className="profile-section-desc">
              Clientes activos registrados en el sistema
            </p>
          </div>
        </div>

        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Telefono</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.apellido}</td>
                  <td>{c.dni}</td>
                  <td>{c.email}</td>
                  <td>{c.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clientes.length === 0 && (
          <p className="empty-msg">No hay clientes registrados.</p>
        )}
      </section>

      {/* LISTADO DE DADAS DE BAJA (solo administrador) */}
      <section className="profile-section">
        <div className="profile-section-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <line x1="17" y1="8" x2="23" y2="14" />
            <line x1="23" y1="8" x2="17" y2="14" />
          </svg>
          <div>
            <h2>Clientes dados de baja</h2>
            <p className="profile-section-desc">
              Cuentas con baja logica. Este listado es visible unicamente para
              el administrador.
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleToggleBajas}
          >
            {showBajas ? 'Ocultar listado' : 'Ver clientes dados de baja'}
          </button>
        </div>

        {showBajas && (
          <>
            {loadingBajas ? (
              <p className="empty-msg">Cargando...</p>
            ) : (
              <div className="crud-table-wrapper">
                <table className="crud-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>DNI</th>
                      <th>Email</th>
                      <th>Telefono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bajas.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.nombre}</td>
                        <td>{c.apellido}</td>
                        <td>{c.dni}</td>
                        <td>{c.email}</td>
                        <td>{c.telefono}</td>
                        <td className="actions">
                          <button
                            className="btn btn-sm btn-edit"
                            onClick={() => handleAlta(c.id)}
                          >
                            Dar de alta
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loadingBajas && bajas.length === 0 && (
              <p className="empty-msg">No hay clientes dados de baja.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ClientesPage;
