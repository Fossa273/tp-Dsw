/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { useClients } from '../hooks/useClients';
import { api } from '../services/api';

const SORT_OPTIONS = [
  { value: 'dni-asc', label: 'DNI (menor a mayor)' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateClient = (data, { requirePassword = false } = {}) => {
  if (!data.firstName || !String(data.firstName).trim()) {
    return 'El nombre es obligatorio';
  }
  if (data.firstName.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  if (!data.lastName || !String(data.lastName).trim()) {
    return 'El apellido es obligatorio';
  }
  if (data.lastName.trim().length < 2) {
    return 'El apellido debe tener al menos 2 caracteres';
  }
  if (!data.dni || !String(data.dni).trim()) {
    return 'El DNI es obligatorio';
  }
  if (!/^\d+$/.test(String(data.dni))) {
    return 'El DNI debe contener solo numeros';
  }
  if (String(data.dni).length < 7 || String(data.dni).length > 8) {
    return 'El DNI debe tener entre 7 y 8 digitos';
  }
  if (!data.email || !EMAIL_REGEX.test(String(data.email))) {
    return 'Ingrese un email valido';
  }
  if (!data.phone || !String(data.phone).trim()) {
    return 'El telefono es obligatorio';
  }
  if (!/^\d+$/.test(String(data.phone))) {
    return 'El telefono debe contener solo numeros';
  }
  if (String(data.phone).length < 6) {
    return 'El telefono debe tener al menos 6 digitos';
  }
  if (requirePassword) {
    if (!data.password || String(data.password).length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
  }
  return null;
};

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

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClientsPage = () => {
  const { clients, loading, error, create, update, remove, refetch } =
    useClients();

  const [inactive, setInactive] = useState([]);
  const [showInactive, setShowInactive] = useState(true);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const fetchInactive = async () => {
    setLoadingInactive(true);
    try {
      const res = await api.clients.getInactive();
      setInactive(res.data || []);
    } catch {
      setInactive([]);
    } finally {
      setLoadingInactive(false);
    }
  };

  useEffect(() => {
    fetchInactive();
  }, []);

  const handleReactivate = async (id) => {
    try {
      await api.clients.reactivate(id);
      showMessage('Cliente dado de alta correctamente');
      await Promise.all([fetchInactive(), refetch()]);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    password: '',
  });

  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('dni-asc');

  // Inline edit of the list
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
    const err = validateClient(registerForm, { requirePassword: true });
    if (err) {
      showMessage(err, 'error');
      return;
    }
    try {
      await create({
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        dni: registerForm.dni.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password,
      });
      setRegisterForm({
        firstName: '',
        lastName: '',
        dni: '',
        email: '',
        phone: '',
        password: '',
      });
      showMessage('Cliente registrado correctamente');
    } catch (errMsg) {
      showMessage(errMsg.message, 'error');
    }
  };

  const toggleEditMode = () => {
    if (!editMode) {
      // Seed drafts from the current client list
      const seed = {};
      clients.forEach((c) => {
        seed[String(c.id)] = {
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          dni: c.dni || '',
          email: c.email || '',
          phone: c.phone || '',
        };
      });
      setDrafts(seed);
      setEditMode(true);
    } else {
      setDrafts({});
      setEditMode(false);
    }
  };

  const handleDraftChange = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [String(id)]: { ...prev[String(id)], [field]: value },
    }));
  };

  const handleDraftSave = async (id) => {
    const draft = drafts[String(id)];
    if (!draft) return;
    const err = validateClient(draft);
    if (err) {
      showMessage(err, 'error');
      return;
    }
    try {
      await update(id, {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        dni: draft.dni.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      });
      showMessage('Datos actualizados correctamente');
    } catch (errMsg) {
      showMessage(errMsg.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    setDeleteConfirmId(null);
    try {
      await remove(id);
      showMessage('Cliente dado de baja correctamente');
      fetchInactive();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const allClients = useMemo(() => {
    const list = [...clients];
    if (showInactive) {
      for (const c of inactive) {
        if (!list.some((x) => String(x.id) === String(c.id))) {
          list.push(c);
        }
      }
    }
    const term = search.trim().toLowerCase();
    let result = list;
    if (term) {
      result = result.filter((c) => {
        const haystack = [
          c.firstName,
          c.lastName,
          c.dni,
          c.email,
          c.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }
    const sorted = [...result];
    switch (sort) {
      case 'dni-asc':
        sorted.sort((a, b) =>
          String(a.dni ?? '').localeCompare(String(b.dni ?? ''), 'es', {
            numeric: true,
          })
        );
        break;
      case 'name-asc':
        sorted.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
            'es'
          )
        );
        break;
      case 'name-desc':
        sorted.sort((a, b) =>
          `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`,
            'es'
          )
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [clients, inactive, showInactive, search, sort]);

  const isInactive = (id) => !clients.some((c) => String(c.id) === String(id));

  if (loading) return <div className="loading">Cargando clientes...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const visibleClients = allClients.filter((c) =>
    showInactive ? true : !isInactive(c.id)
  );

  return (
    <div className="crud-page">
      <h1>Gestion de Clientes</h1>

      {msg && (
        <div
          className={`crud-message ${
            msgType === 'error' ? 'msg-error' : 'msg-success'
          }`}
        >
          {msg}
        </div>
      )}

      {/* SECTION 1: REGISTRATION */}
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
              <label htmlFor="reg-firstName">Nombre</label>
              <input
                id="reg-firstName"
                name="firstName"
                placeholder="Nombre"
                value={registerForm.firstName}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-lastName">Apellido</label>
              <input
                id="reg-lastName"
                name="lastName"
                placeholder="Apellido"
                value={registerForm.lastName}
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
              <label htmlFor="reg-phone">Telefono</label>
              <input
                id="reg-phone"
                name="phone"
                placeholder="Solo numeros"
                value={registerForm.phone}
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
                placeholder="DNI (solo numeros)"
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
                placeholder="Minimo 6 caracteres"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-icon">
              <PlusIcon />
              Registrar cliente
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: GENERAL LISTING */}
      <section className="profile-section">
        <div className="profile-section-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div>
            <h2>Listado general de clientes</h2>
            <p className="profile-section-desc">
              Todos los clientes identificados por DNI. Los que estan dados de
              baja se muestran atenuados. Para modificar, active el lapiz y
              edite directamente los campos de cada fila.
            </p>
          </div>
        </div>

        <div className="crud-toolbar">
          <div className="crud-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, email o telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="crud-sort">
            <label htmlFor="client-sort">Ordenar</label>
            <select id="client-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            title={editMode ? 'Terminar edicion' : 'Editar campos de la tabla'}
            onClick={toggleEditMode}
          >
            <PencilIcon />
            {editMode ? 'Terminar edicion' : 'Editar tabla'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            title={showInactive ? 'Ocultar clientes inactivos' : 'Mostrar clientes inactivos'}
            onClick={() => setShowInactive((prev) => !prev)}
          >
            {showInactive ? <EyeIcon /> : <EyeOffIcon />}
            {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </button>
        </div>

        {loadingInactive && (
          <p className="empty-msg">Cargando datos de clientes...</p>
        )}

        <div className="crud-table-wrapper">
          <table className="crud-table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Estado</th>
                <th>Sesion</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((c) => {
                const inactiveRow = isInactive(c.id);
                const draft = drafts[String(c.id)];
                const editing = editMode && draft;
                return (
                  <tr key={c.id} className={inactiveRow ? 'row-inactive' : ''}>
                    <td className="dni-cell">
                      {editing ? (
                        <input
                          className="inline-input"
                          value={draft.dni}
                          onChange={(e) => handleDraftChange(c.id, 'dni', e.target.value)}
                        />
                      ) : (
                        <strong>{c.dni || '-'}</strong>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="inline-input"
                          value={draft.firstName}
                          onChange={(e) =>
                            handleDraftChange(c.id, 'firstName', e.target.value)
                          }
                        />
                      ) : (
                        c.firstName
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="inline-input"
                          value={draft.lastName}
                          onChange={(e) =>
                            handleDraftChange(c.id, 'lastName', e.target.value)
                          }
                        />
                      ) : (
                        c.lastName
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="inline-input"
                          value={draft.email}
                          onChange={(e) =>
                            handleDraftChange(c.id, 'email', e.target.value)
                          }
                        />
                      ) : (
                        c.email
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="inline-input"
                          value={draft.phone}
                          onChange={(e) =>
                            handleDraftChange(c.id, 'phone', e.target.value)
                          }
                        />
                      ) : (
                        c.phone
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${inactiveRow ? 'badge-inactive' : 'badge-active'}`}>
                        {inactiveRow ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${c.logged ? 'badge-online' : 'badge-offline'}`}>
                        {c.logged ? 'Conectado' : 'Desconectado'}
                      </span>
                    </td>
                    <td className="actions">
                      {inactiveRow ? (
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => handleReactivate(c.id)}
                        >
                          Dar de alta
                        </button>
                      ) : editing ? (
                        <>
                          <button
                            className="btn btn-sm btn-edit"
                            onClick={() => handleDraftSave(c.id)}
                          >
                            <CheckIcon /> Guardar
                          </button>
                          {deleteConfirmId === c.id ? (
                            <span className="confirm-msg">¿Eliminar?</span>
                          ) : null}
                        </>
                      ) : deleteConfirmId === c.id ? (
                        <>
                          <span className="confirm-msg">¿Eliminar cuenta?</span>
                          <button
                            className="btn btn-sm btn-delete"
                            onClick={() => handleDelete(c.id)}
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm btn-edit"
                            onClick={toggleEditMode}
                          >
                            <PencilIcon /> Editar
                          </button>
                          <button
                            className="btn btn-sm btn-delete"
                            onClick={() => handleDelete(c.id)}
                          >
                            ELIMINAR
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {allClients.length === 0 && (
          <p className="empty-msg">No hay clientes registrados.</p>
        )}
        {allClients.length > 0 && visibleClients.length === 0 && (
          <p className="empty-msg">
            No se encontraron clientes con la busqueda actual.
          </p>
        )}
      </section>
    </div>
  );
};

export default ClientsPage;