import { useEffect, useMemo, useRef, useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';
import { useTrips } from '../hooks/useTrips';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const STATE_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATE_LABEL = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BookingsPage = () => {
  const { bookings, loading, error, create, update, remove, refetch } = useBookings();
  const { clients, loading: loadingClients } = useClients();
  const { trips, loading: loadingTrips } = useTrips();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    clientId: '',
    tripId: '',
    numSeats: '',
    state: 'pending',
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
    if (!form.clientId) {
      showMessage('Debe seleccionar un cliente', 'error');
      return;
    }
    if (!form.tripId) {
      showMessage('Debe seleccionar un viaje', 'error');
      return;
    }
    const seats = Number(form.numSeats);
    if (!form.numSeats || !Number.isInteger(seats) || seats < 1) {
      showMessage('La cantidad de asientos debe ser un entero mayor a 0', 'error');
      return;
    }

    const payload = {
      clientId: Number(form.clientId),
      tripId: Number(form.tripId),
      numSeats: seats,
      state: form.state,
    };

    try { setSubmitting(true);
      if (editingId) {
        await update(editingId, payload);
        showMessage('Reserva actualizada correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Reserva creada correctamente');
      }
      setForm({ clientId: '', tripId: '', numSeats: '', state: 'pending' });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (booking) => {
    setEditingId(booking.id);
    setPendingDelete(null);
    setForm({
      clientId: String(booking.clientId ?? ''),
      tripId: String(booking.tripId ?? ''),
      numSeats: String(booking.numSeats ?? ''),
      state: booking.state || 'pending',
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
        setForm({ clientId: '', tripId: '', numSeats: '', state: 'pending' });
      }
      showMessage('Reserva eliminada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ clientId: '', tripId: '', numSeats: '', state: 'pending' });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((r) => {
      const client = (r.client?.firstName || '') + ' ' + (r.client?.lastName || '');
      const journey =
        (r.trip?.journey?.origin?.name || '') + ' ' + (r.trip?.journey?.destination?.name || '');
      return (
        client.toLowerCase().includes(term) ||
        journey.toLowerCase().includes(term) ||
        String(r.tripId).includes(term)
      );
    });
  }, [bookings, search]);

  if (loading) return <div className="loading">Cargando reservas...</div>;
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  const clientName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || '-';
  const viajeLabel = (v) =>
    v
      ? (v.journey?.origin?.name || '-') +
        ' -> ' +
        (v.journey?.destination?.name || '-') +
        ' (' +
        formatDate(v.departureDate) +
        ')'
      : '-';

  return (
    <div className="crud-page">
      <h1>Gestion de Reservas</h1>

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
        <h2>{editingId ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
        <div className="form-row">
          <label htmlFor="reserva-cliente" className="form-label">
            Cliente
          </label>
          <select
            id="reserva-cliente"
            name="clientId"
            value={form.clientId}
            onChange={handleChange}
            disabled={loadingClients}
            required
          >
            <option value="">-- Seleccionar cliente --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientName(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="reserva-viaje" className="form-label">
            Viaje
          </label>
          <select
            id="reserva-viaje"
            name="tripId"
            value={form.tripId}
            onChange={handleChange}
            disabled={loadingTrips}
            required
          >
            <option value="">-- Seleccionar viaje --</option>
            {trips.map((v) => (
              <option key={v.id} value={v.id}>
                {viajeLabel(v)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="reserva-asientos" className="form-label">
            Cantidad de asientos
          </label>
          <input
            id="reserva-asientos"
            name="numSeats"
            type="number"
            min="1"
            placeholder="Ej: 2"
            value={form.numSeats}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="reserva-estado" className="form-label">
            Estado
          </label>
          <select
            id="reserva-estado"
            name="state"
            value={form.state}
            onChange={handleChange}
          >
            {STATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear reserva'}
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
            placeholder="Buscar por cliente o recorrido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Viaje</th>
              <th>Asientos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.client ? clientName(r.client) : '-'}</td>
                <td>{viajeLabel(r.trip)}</td>
                <td>{r.numSeats}</td>
                <td>
                  <span className={`status-badge status-${r.state || 'pending'}`}>
                    {STATE_LABEL[r.state] || r.state}
                  </span>
                </td>
                <td className="actions">
                  {pendingDelete === r.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar esta reserva?</span>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(r.id)}
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
                        onClick={() => handleEdit(r)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(r.id)}
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
          {bookings.length === 0
            ? 'No hay reservas registradas.'
            : 'No se encontraron reservas con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default BookingsPage;