import { useMemo, useState } from 'react';
import { useLocalities } from '../hooks/useLocalities';

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

const LocalitiesPage = () => {
  const { localities, loading, error, create, update, remove } =
    useLocalities();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (editingId) {
        await update(editingId, { name });
        showMessage('Localidad actualizada correctamente');
        setEditingId(null);
      } else {
        await create({ name });
        showMessage('Localidad creada correctamente');
      }
      setForm({ name: '' });
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEdit = (locality) => {
    setEditingId(locality.id);
    setPendingDelete(null);
    setForm({ name: locality.name || '' });
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
      showMessage('Localidad eliminada correctamente');
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
    let result = localities;
    if (term) {
      result = result.filter((l) => l.name.toLowerCase().includes(term));
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
  }, [localities, search, sort]);

  if (loading) return <div className="loading">Cargando localidades...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Localidades</h1>

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
        <h2>{editingId ? 'Editar Localidad' : 'Nueva Localidad'}</h2>
        <div className="form-row">
          <input
            name="name"
            placeholder="Nombre de la localidad"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon">
            <PlusIcon />
            {editingId ? 'Actualizar' : 'Crear localidad'}
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
            placeholder="Buscar localidad por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="crud-sort">
          <label htmlFor="loc-sort">Ordenar</label>
          <select id="loc-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
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
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td className="actions">
                  {pendingDelete === l.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar esta localidad?</span>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(l.id)}
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
                        onClick={() => handleEdit(l)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(l.id)}
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
          {localities.length === 0
            ? 'No hay localidades registradas.'
            : 'No se encontraron localidades con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default LocalitiesPage;