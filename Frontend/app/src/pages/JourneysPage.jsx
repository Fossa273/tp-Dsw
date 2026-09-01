import { useEffect, useMemo, useRef, useState } from 'react';
import { useJourneys } from '../hooks/useJourneys';
import { useLocalities } from '../hooks/useLocalities';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'distance-asc', label: 'Distancia (menor a mayor)' },
  { value: 'distance-desc', label: 'Distancia (mayor a menor)' },
  { value: 'duration-asc', label: 'Duracion (menor a mayor)' },
  { value: 'duration-desc', label: 'Duracion (mayor a menor)' },
];

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes)) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
};

const JourneysPage = () => {
  const { journeys, loading, error, create, update, remove, refetch } = useJourneys();
  const { localities, loading: loadingLocalities } = useLocalities();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    originId: '',
    destinationId: '',
    distanceKm: '',
    durationMinutes: '',
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('distance-asc');
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

  const isValidPositiveInt = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const originId = Number(form.originId);
    const destinationId = Number(form.destinationId);

    if (!form.originId || !form.destinationId) {
      showMessage('Debe seleccionar origen y destino', 'error');
      return;
    }
    if (originId === destinationId) {
      showMessage('El origen y el destino deben ser localidades distintas', 'error');
      return;
    }
    if (!form.distanceKm.trim() || !isValidPositiveInt(form.distanceKm)) {
      showMessage('La distancia debe ser un numero entero mayor a 0', 'error');
      return;
    }
    if (
      !form.durationMinutes.trim() ||
      !isValidPositiveInt(form.durationMinutes)
    ) {
      showMessage('La duracion debe ser un numero entero mayor a 0', 'error');
      return;
    }

    const payload = {
      originId,
      destinationId,
      distanceKm: Number(form.distanceKm),
      durationMinutes: Number(form.durationMinutes),
    };

    try { setSubmitting(true);
      if (editingId) {
        await update(editingId, payload);
        showMessage('Trayecto actualizado correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Trayecto creado correctamente');
      }
      setForm({
        originId: '',
        destinationId: '',
        distanceKm: '',
        durationMinutes: '',
      });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (journey) => {
    setEditingId(journey.id);
    setPendingDelete(null);
    setForm({
      originId: String(journey.originId ?? ''),
      destinationId: String(journey.destinationId ?? ''),
      distanceKm: String(journey.distanceKm ?? ''),
      durationMinutes: String(journey.durationMinutes ?? ''),
    });
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
        setForm({
          originId: '',
          destinationId: '',
          distanceKm: '',
          durationMinutes: '',
        });
      }
      showMessage('Trayecto eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      originId: '',
      destinationId: '',
      distanceKm: '',
      durationMinutes: '',
    });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = journeys;
    if (term) {
      result = result.filter(
        (t) =>
          (t.origin?.name || '').toLowerCase().includes(term) ||
          (t.destination?.name || '').toLowerCase().includes(term)
      );
    }
    const sorted = [...result];
    switch (sort) {
      case 'distance-asc':
        sorted.sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm));
        break;
      case 'distance-desc':
        sorted.sort((a, b) => Number(b.distanceKm) - Number(a.distanceKm));
        break;
      case 'duration-asc':
        sorted.sort(
          (a, b) => Number(a.durationMinutes) - Number(b.durationMinutes)
        );
        break;
      case 'duration-desc':
        sorted.sort(
          (a, b) => Number(b.durationMinutes) - Number(a.durationMinutes)
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [journeys, search, sort]);

  if (loading) return <div className="loading">Cargando trayectos...</div>;
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  const localitiesSorted = [...localities].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'es')
  );

  return (
    <div className="crud-page">
      <h1>Gestion de Trayectos</h1>

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
        <h2>{editingId ? 'Editar Trayecto' : 'Nuevo Trayecto'}</h2>
        <div className="form-row">
          <label htmlFor="tray-origen" className="form-label">
            Origen
          </label>
          <select
            id="tray-origen"
            name="originId"
            value={form.originId}
            onChange={handleChange}
            disabled={loadingLocalities}
            required
          >
            <option value="">-- Seleccionar localidad --</option>
            {localitiesSorted.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="tray-destino" className="form-label">
            Destino
          </label>
          <select
            id="tray-destino"
            name="destinationId"
            value={form.destinationId}
            onChange={handleChange}
            disabled={loadingLocalities}
            required
          >
            <option value="">-- Seleccionar localidad --</option>
            {localitiesSorted.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="tray-distancia" className="form-label">
            Distancia (km)
          </label>
          <input
            id="tray-distancia"
            name="distanceKm"
            type="number"
            min="1"
            placeholder="Ej: 300"
            value={form.distanceKm}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="tray-duracion" className="form-label">
            Duracion aproximada (minutos)
          </label>
          <input
            id="tray-duracion"
            name="durationMinutes"
            type="number"
            min="1"
            placeholder="Ej: 240"
            value={form.durationMinutes}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear trayecto'}
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
            placeholder="Buscar por origen o destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="crud-sort">
          <label htmlFor="tray-sort">Ordenar</label>
          <select
            id="tray-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
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
              <th>Origen</th>
              <th>Destino</th>
              <th>Distancia</th>
              <th>Duracion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{t.origin?.name || '-'}</td>
                <td>{t.destination?.name || '-'}</td>
                <td>{t.distanceKm} km</td>
                <td>{formatDuration(t.durationMinutes)}</td>
                <td className="actions">
                  {pendingDelete === t.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar este trayecto?</span>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(t.id)}
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
                        onClick={() => handleEdit(t)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(t.id)}
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
          {journeys.length === 0
            ? 'No hay trayectos registrados.'
            : 'No se encontraron trayectos con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default JourneysPage;