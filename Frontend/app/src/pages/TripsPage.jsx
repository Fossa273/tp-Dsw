import { useEffect, useMemo, useRef, useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useJourneys } from '../hooks/useJourneys';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { PlusIcon } from '../components/icons';
import { formatDate } from '../utils/format';

const DAYS = [
  { id: 0, name: 'Domingo' }, { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' }, { id: 3, name: 'Miercoles' },
  { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sabado' },
];

const TripsPage = () => {
  const { trips, loading, error, create, update, remove, refetch } = useTrips();
  const { journeys, loading: loadingJourneys } = useJourneys();
  const { drivers, loading: loadingDrivers } = useDrivers();
  const { vehicles, loading: loadingVehicles } = useVehicles();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    journeyId: '',
    driverId: '',
    vehicleId: '',
    scheduleType: 'weekly',
    dayOfWeek: '',
    departureTime: '',
    departureDate: '',
    isPromoted: false,
    promoExpiry: '',
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
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
    if (!form.journeyId || !form.driverId || !form.vehicleId) {
      showMessage('Debe seleccionar trayecto, conductor y vehiculo', 'error');
      return;
    }
    if (form.scheduleType === 'weekly' && (!form.dayOfWeek || !form.departureTime)) {
      showMessage('Debe seleccionar el dia y la hora de salida', 'error');
      return;
    }
    if (form.scheduleType === 'specific' && !form.departureDate) {
      showMessage('La fecha y hora de salida son obligatorias', 'error');
      return;
    }

    const payload = {
      journeyId: Number(form.journeyId),
      driverId: Number(form.driverId),
      vehicleId: Number(form.vehicleId),
      scheduleType: form.scheduleType,
      dayOfWeek: form.scheduleType === 'weekly' ? Number(form.dayOfWeek) : undefined,
      departureTime: form.scheduleType === 'weekly' ? form.departureTime : undefined,
      departureDate: form.scheduleType === 'specific'
        ? new Date(form.departureDate).toISOString()
        : undefined,
      isPromoted: form.isPromoted,
      promoExpiry: form.isPromoted && form.promoExpiry
        ? new Date(form.promoExpiry).toISOString()
        : null,
    };

    try { setSubmitting(true);
      if (editingId) {
        await update(editingId, payload);
        showMessage('Viaje actualizado correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Viaje creado correctamente');
      }
      setForm({ journeyId: '', driverId: '', vehicleId: '', scheduleType: 'weekly', dayOfWeek: '', departureTime: '', departureDate: '', isPromoted: false, promoExpiry: '' });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (trip) => {
    setEditingId(trip.id);
    setPendingDelete(null);
    setForm({
      journeyId: String(trip.journeyId ?? ''),
      driverId: String(trip.driverId ?? ''),
      vehicleId: String(trip.vehicleId ?? ''),
      scheduleType: trip.scheduleType || 'weekly',
      dayOfWeek: String(trip.dayOfWeek ?? ''),
      departureTime: trip.departureTime || '',
      departureDate: trip.departureDate ? new Date(trip.departureDate).toISOString().slice(0, 16) : '',
      isPromoted: !!trip.isPromoted,
      promoExpiry: trip.promoExpiry ? new Date(trip.promoExpiry).toISOString().slice(0, 10) : '',
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
        setForm({ journeyId: '', driverId: '', vehicleId: '', scheduleType: 'weekly', dayOfWeek: '', departureTime: '', departureDate: '', isPromoted: false, promoExpiry: '' });
      }
      showMessage('Viaje eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ journeyId: '', driverId: '', vehicleId: '', scheduleType: 'weekly', dayOfWeek: '', departureTime: '', departureDate: '', isPromoted: false, promoExpiry: '' });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return trips;
    return trips.filter((v) => {
      const journey =
        (v.journey?.origin?.name || '') + ' ' + (v.journey?.destination?.name || '');
      const driver = (v.driver?.firstName || '') + ' ' + (v.driver?.lastName || '');
      return (
        journey.toLowerCase().includes(term) ||
        driver.toLowerCase().includes(term) ||
        String(v.vehicleId).includes(term)
      );
    });
  }, [trips, search]);

  if (loading) return <div className="loading">Cargando viajes...</div>;
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  const journeysSorted = [...journeys].sort((a, b) =>
    ((a.origin?.name || '') + ' -> ' + (a.destination?.name || '')).localeCompare(
      (b.origin?.name || '') + ' -> ' + (b.destination?.name || ''),
      'es'
    )
  );
  const driverName = (d) => `${d.firstName || ''} ${d.lastName || ''}`.trim();

  return (
    <div className="crud-page">
      <h1>Gestion de Viajes</h1>

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
        <h2>{editingId ? 'Editar Viaje' : 'Nuevo Viaje'}</h2>
        <div className="form-row">
          <label htmlFor="viaje-ruta" className="form-label">
            Trayecto
          </label>
          <select
            id="viaje-ruta"
            name="journeyId"
            value={form.journeyId}
            onChange={handleChange}
            disabled={loadingJourneys}
            required
          >
            <option value="">-- Seleccionar trayecto --</option>
            {journeysSorted.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin?.name} -&gt; {r.destination?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="viaje-conductor" className="form-label">
            Conductor
          </label>
          <select
            id="viaje-conductor"
            name="driverId"
            value={form.driverId}
            onChange={handleChange}
            disabled={loadingDrivers}
            required
          >
            <option value="">-- Seleccionar conductor --</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {driverName(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="viaje-vehiculo" className="form-label">
            Vehiculo
          </label>
          <select
            id="viaje-vehiculo"
            name="vehicleId"
            value={form.vehicleId}
            onChange={handleChange}
            disabled={loadingVehicles}
            required
          >
            <option value="">-- Seleccionar vehiculo --</option>
            {vehicles.filter((v) => !v.maintenance || String(v.id) === String(form.vehicleId)).map((v) => (
              <option key={v.id} value={v.id}>
                Unidad #{v.id} ({v.category}, {v.maxCapacity} asientos{v.hasBathroom ? ', con baño' : ''}{v.maintenance ? ', en mantenimiento' : ''})
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="viaje-tipo" className="form-label">
            Programacion
          </label>
          <select
            id="viaje-tipo"
            name="scheduleType"
            value={form.scheduleType}
            onChange={handleChange}
            required
          >
            <option value="weekly">Fijo semanal</option>
            <option value="specific">Fecha especifica</option>
          </select>
        </div>
        {form.scheduleType === 'weekly' ? (
          <>
            <div className="form-row">
              <label htmlFor="viaje-dia" className="form-label">Dia de la semana</label>
              <select id="viaje-dia" name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} required>
                <option value="">-- Seleccionar dia --</option>
                {DAYS.map((day) => <option key={day.id} value={day.id}>{day.id} - {day.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="viaje-hora" className="form-label">Hora de salida</label>
              <input id="viaje-hora" name="departureTime" type="time" value={form.departureTime} onChange={handleChange} required />
            </div>
          </>
        ) : (
          <div className="form-row">
            <label htmlFor="viaje-salida" className="form-label">Fecha y hora de salida</label>
            <input id="viaje-salida" name="departureDate" type="datetime-local" value={form.departureDate} onChange={handleChange} required />
          </div>
        )}
        <p className="profile-section-desc">
          La fecha y hora de llegada se calculan automaticamente sumando la duracion del trayecto.
        </p>
        <div className="form-row form-row-inline">
          <label className="form-label toggle-label">
            <input
              type="checkbox"
              checked={form.isPromoted}
              onChange={(e) => setForm({ ...form, isPromoted: e.target.checked, promoExpiry: e.target.checked ? form.promoExpiry : '' })}
            />
            <span className="toggle-switch" />
            Promocionar viaje
          </label>
        </div>
        {form.isPromoted && (
          <div className="form-row">
            <label htmlFor="viaje-promo-expiry" className="form-label">Vencimiento de la promocion</label>
            <input
              id="viaje-promo-expiry"
              name="promoExpiry"
              type="date"
              value={form.promoExpiry}
              onChange={handleChange}
            />
          </div>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear viaje'}
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
            placeholder="Buscar por recorrido o conductor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Recorrido</th>
              <th>Conductor</th>
              <th>Vehiculo</th>
              <th>Salida</th>
              <th>Llegada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  {v.journey?.origin?.name || '-'} &rarr; {v.journey?.destination?.name || '-'}
                </td>
                <td>{v.driver ? driverName(v.driver) : '-'}</td>
                <td>
                  Unidad #{v.vehicle?.id ?? v.vehicleId} ({v.vehicle?.maxCapacity ?? '-'} asientos)
                </td>
                <td>{v.departureDate ? formatDate(v.departureDate) : `${DAYS[v.dayOfWeek]?.name || '-'} ${v.departureTime || '-'}`}</td>
                <td>{v.arrivalDate ? formatDate(v.arrivalDate) : v.arrivalTime || '-'}</td>
                <td className="actions">
                  {pendingDelete === v.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar este viaje?</span>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(v.id)}
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
                        onClick={() => handleEdit(v)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(v.id)}
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
          {trips.length === 0
            ? 'No hay viajes registrados.'
            : 'No se encontraron viajes con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default TripsPage;