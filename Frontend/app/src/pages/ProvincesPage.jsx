import { useEffect, useMemo, useRef, useState } from 'react';
import { useProvinces } from '../hooks/useProvinces';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
];

const ProvincesPage = () => {
  const { provinces, loading, error, create, update, remove, refetch } = useProvinces();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');

  const msgTimer = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const name = form.name.trim();
    if (!name) {
      showMessage('El nombre es obligatorio', 'error');
      return;
    }
    if (name.length < 2) {
      showMessage('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await update(editingId, { name });
        showMessage('Provincia actualizada correctamente');
        setEditingId(null);
      } else {
        await create({ name });
        showMessage('Provincia creada correctamente');
      }
      setForm({ name: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (province) => {
    setEditingId(province.id);
    setPendingDelete(null);
    setForm({ name: province.name || '' });
  };

  const handleDelete = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    setPendingDelete(null);
    try {
      await remove(id);
      if (String(editingId) === String(id)) {
        setEditingId(null);
        setForm({ name: '' });
      }
      showMessage('Provincia eliminada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '' });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = provinces;
    if (term) {
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }
    const sorted = [...result];
    switch (sort) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'es'));
        break;
      default:
        break;
    }
    return sorted;
  }, [provinces, search, sort]);

  if (loading) return <div className="loading">Cargando provincias...</div>;
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  return (
    <div className="crud-page">
      <h1>Gestion de Provincias</h1>

      {msg && (
        <div
          className={`crud-message ${
            msgType === 'error' ? 'msg-error' : 'msg-success'
          }`}
        >
          {msg}
        </div>
      )}

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar Provincia' : 'Nueva Provincia'}</h2>
        <div className="form-row">
          <input
            name="name"
            placeholder="Nombre de la provincia"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear provincia'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="crud-toolbar">
        <div className="crud-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar provincia por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="crud-sort">
          <label htmlFor="prov-sort">Ordenar</label>
          <select id="prov-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="actions">
                  {pendingDelete === p.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar esta provincia?</span>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(p.id)}
                      >
                        Confirmar
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setPendingDelete(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(p.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="empty-msg">
          {provinces.length === 0
            ? 'No hay provincias registradas.'
            : 'No se encontraron provincias con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default ProvincesPage;