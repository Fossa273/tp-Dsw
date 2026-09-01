import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalities } from '../hooks/useLocalities';
import { useProvinces } from '../hooks/useProvinces';
import { api } from '../services/api';
import { localityLabel } from '../utils/format';

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
  const { localities, loading, error, refetch } = useLocalities();
  const { provinces, loading: loadingProvinces } = useProvinces();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', provinceId: '' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [candidates, setCandidates] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingEditId, setPendingEditId] = useState(null);

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

  const doSubmit = async (name, provinceId, editId) => {
    const payload = { name, provinceId: provinceId || undefined };
    try {
      setSubmitting(true);
      let res;
      if (editId) {
        res = await api.localities.update(editId, payload);
      } else {
        res = await api.localities.create(payload);
      }
      if (res.warning) {
        showMessage(res.warning, 'success');
      } else {
        showMessage(editId ? 'Localidad actualizada correctamente' : 'Localidad creada correctamente');
      }
      if (editId) setEditingId(null);
      setForm({ name: '', provinceId: '' });
      await refetch();
    } catch (err) {
      if (err.data?.candidates) {
        setPendingName(name);
        setPendingEditId(editId);
        setCandidates(err.data.candidates);
        showMessage(err.data?.error || err.message, 'success');
      } else {
        showMessage(err.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
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
    await doSubmit(name, form.provinceId, editingId);
  };

  const handleCandidatePick = async (provinceId) => {
    setCandidates(null);
    await doSubmit(pendingName, provinceId, pendingEditId);
  };

  const handleCancelCandidate = () => {
    setCandidates(null);
    setPendingName('');
    setPendingEditId(null);
  };

  const handleEdit = (locality) => {
    setEditingId(locality.id);
    setPendingDelete(null);
    setForm({ name: locality.name || '', provinceId: locality.province?.id ? String(locality.province.id) : '' });
  };

  const handleDelete = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    setPendingDelete(null);
    try {
      await api.localities.delete(id);
      if (String(editingId) === String(id)) {
        setEditingId(null);
        setForm({ name: '', provinceId: '' });
      }
      await refetch();
      showMessage('Localidad eliminada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', provinceId: '' });
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
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  const provincesSorted = [...provinces].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'es')
  );

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

      {candidates && (
        <div className="profile-section" style={{ marginBottom: '1rem' }}>
          <h2>De cual provincia es "{pendingName}"?</h2>
          <p className="profile-section-desc">
            Google Maps encontro este nombre en varias provincias. Seleccione la
            correcta para continuar.
          </p>
          <div className="form-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            {candidates.map((c) => (
              <button
                key={c.name}
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const match = provinces.find(
                    (p) => (p.name || '').toLowerCase() === (c.name || '').toLowerCase()
                  );
                  handleCandidatePick(match?.id ?? null);
                }}
              >
                {c.name} {c.abbreviation ? `(${c.abbreviation})` : ''}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCancelCandidate}
            >
              Cancelar
            </button>
          </div>
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
        <div className="form-row">
          <label htmlFor="loc-province" className="form-label">
            Provincia
          </label>
          <select
            id="loc-province"
            name="provinceId"
            value={form.provinceId}
            onChange={handleChange}
            disabled={loadingProvinces}
          >
            <option value="">-- Sin provincia (Google lo verificara) --</option>
            {provincesSorted.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear localidad'}
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
              <th>Provincia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.province ? `${l.province.name} (${l.province.abbreviation || ''})` : '-'}</td>
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