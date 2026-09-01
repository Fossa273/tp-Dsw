import { useMemo, useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useJourneys } from '../hooks/useJourneys';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleString('es-AR', opts);
};

const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('sv-SE').replace('T', ' ').slice(0, 16);
};

const TripsPage = () => {
  const { trips, loading, error, create, update, remove } = useTrips();
  const { journeys, loading: loadingJourneys } = useJourneys();
  const { drivers, loading: loadingDrivers } = useDrivers();
  const { vehicles, loading: loadingVehicles } = useVehicles();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    journeyId: '',
    driverId: '',
    vehicleId: '',
    departureDate: '',
    arrivalDate: '',
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const [search, setSearch] = useState('');

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
    if (!form.journeyId || !form.driverId || !form.vehicleId) {
      showMessage('Debe seleccionar trayecto, conductor y vehiculo', 'error');
      return;
    }
    if (!form.departureDate) {
      showMessage('La fecha de salida es obligatoria', 'error');
      return;
    }
    const departure = new Date(form.departureDate);
    if (Number.isNaN(departure.getTime())) {
      showMessage('La fecha de salida es invalida', 'error');
      return;
    }
    if (form.arrivalDate) {
      const arrival = new Date(form.arrivalDate);
      if (Number.isNaN(arrival.getTime())) {
        showMessage('La fecha de llegada es invalida', 'error');
        return;
      }
      if (arrival <= departure) {
        showMessage(
          'La fecha de llegada debe ser posterior a la de salida',
          'error'
        );
        return;
      }
    }

    const payload = {
      journeyId: Number(form.journeyId),
      driverId: Number(form.driverId),
      vehicleId: Number(form.vehicleId),
      departureDate: departure.toISOString(),
      arrivalDate: form.arrivalDate
        ? new Date(form.arrivalDate).toISOString()
        : null,
    };

    try {
      if (editingId) {
        await update(editingId, payload);
        showMessage('Viaje actualizado correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Viaje creado correctamente');
      }
      setForm({ journeyId: '', driverId: '', vehicleId: '', departureDate: '', arrivalDate: '' });
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEdit = (trip) => {
    setEditingId(trip.id);
    setPendingDelete(null);
    setForm({
      journeyId: String(trip.journeyId ?? ''),
      driverId: String(trip.driverId ?? ''),
      vehicleId: String(trip.vehicleId ?? ''),
      departureDate: toLocalInputValue(trip.departureDate),
      arrivalDate: toLocalInputValue(trip.arrivalDate),
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
        setForm({ journeyId: '', driverId: '', vehicleId: '', departureDate: '', arrivalDate: '' });
      }
      showMessage('Viaje eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ journeyId: '', driverId: '', vehicleId: '', departureDate: '', arrivalDate: '' });
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
  if (error) return <div className="error">Error: {error}</div>;

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
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Unidad #{v.id} ({v.maxCapacity} asientos)
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="viaje-salida" className="form-label">
            Fecha y hora de salida
          </label>
          <input
            id="viaje-salida"
            name="departureDate"
            type="datetime-local"
            value={form.departureDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="viaje-llegada" className="form-label">
            Fecha y hora de llegada
          </label>
          <input
            id="viaje-llegada"
            name="arrivalDate"
            type="datetime-local"
            value={form.arrivalDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon">
            <PlusIcon />
            {editingId ? 'Actualizar' : 'Crear viaje'}
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
                <td>{formatDate(v.departureDate)}</td>
                <td>{formatDate(v.arrivalDate)}</td>
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