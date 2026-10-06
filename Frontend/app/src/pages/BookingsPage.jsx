import { useEffect, useMemo, useRef, useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PlusIcon } from '../components/icons';
import { formatDate } from '../utils/format';

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

const tripDepartureDate = (trip) => {
  if (!trip) return null;
  if (trip.scheduleType === 'specific' && trip.departureDate) {
    return trip.departureDate;
  }
  if (trip.dayOfWeek === undefined || !trip.departureTime) return null;
  const now = new Date();
  const [hours, minutes] = trip.departureTime.split(':').map(Number);
  const departure = new Date(now);
  departure.setHours(hours, minutes, 0, 0);
  const daysUntilDeparture = (Number(trip.dayOfWeek) - now.getDay() + 7) % 7;
  departure.setDate(now.getDate() + daysUntilDeparture);
  if (departure <= now) departure.setDate(departure.getDate() + 7);
  return departure.toISOString();
};

const BookingsPage = () => {
  const { user, isAdmin } = useAuth();
  const { bookings, loading, error, create, update, remove, refetch } =
    useBookings(isAdmin ? undefined : user?.id);
  const { clients, loading: loadingClients } = useClients();
  const { trips, loading: loadingTrips } = useTrips();

  const [inlineDrafts, setInlineDrafts] = useState({});
  const [form, setForm] = useState({
    clientId: '',
    tripId: '',
    numSeats: '',
    state: 'pending',
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [search, setSearch] = useState('');
  const msgTimer = useRef(null);

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  useEffect(
    () => () => {
      if (msgTimer.current) clearTimeout(msgTimer.current);
    },
    [],
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors((current) => ({ ...current, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errors = {};
    if (!form.clientId) errors.clientId = 'Selecciona un cliente.';
    if (!form.tripId) errors.tripId = 'Selecciona un viaje.';
    const seats = Number(form.numSeats);
    if (!form.numSeats || !Number.isInteger(seats) || seats < 1) {
      errors.numSeats = 'Ingresa una cantidad entera mayor a 0.';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      clientId: Number(form.clientId),
      tripId: Number(form.tripId),
      numSeats: seats,
      state: form.state,
    };

    try {
      setSubmitting(true);
      await create(payload);
      showMessage('Reserva creada correctamente');
      setForm({ clientId: '', tripId: '', numSeats: '', state: 'pending' });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startInlineEdit = (booking) => {
    setPendingDelete(null);
    setInlineDrafts((current) => ({
      ...current,
      [booking.id]: {
        clientId: String(booking.clientId ?? ''),
        tripId: String(booking.tripId ?? ''),
        numSeats: String(booking.numSeats ?? ''),
        state: booking.state || 'pending',
      },
    }));
  };

  const updateInlineDraft = (id, field, value) => {
    setInlineDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const cancelInlineEdit = (id) => {
    setInlineDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const saveInlineEdit = async (booking) => {
    const draft = inlineDrafts[booking.id];
    if (!draft) return;
    const seats = Number(draft.numSeats);
    if (!draft.tripId || !Number.isInteger(seats) || seats < 1) {
      showMessage(
        'Complete cliente, viaje y una cantidad valida de asientos',
        'error',
      );
      return;
    }
    try {
      setSubmitting(true);
      await update(booking.id, {
        clientId: draft.clientId ? Number(draft.clientId) : null,
        tripId: Number(draft.tripId),
        numSeats: seats,
        state: draft.state,
      });
      cancelInlineEdit(booking.id);
      showMessage('Reserva actualizada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    setPendingDelete(null);
    try {
      await remove(id);
      showMessage('Reserva eliminada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancelBooking = async (id) => {
    if (pendingCancel !== id) {
      setPendingCancel(id);
      return;
    }
    setPendingCancel(null);
    try {
      await api.bookings.cancel(id, user.id);
      await refetch();
      showMessage('Reserva cancelada correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((r) => {
      const client =
        (r.client?.firstName || '') + ' ' + (r.client?.lastName || '');
      const journey =
        (r.trip?.journey?.origin?.name || '') +
        ' ' +
        (r.trip?.journey?.destination?.name || '');
      return (
        client.toLowerCase().includes(term) ||
        journey.toLowerCase().includes(term) ||
        String(r.tripId).includes(term)
      );
    });
  }, [bookings, search]);

  if (loading) return <div className="loading">Cargando reservas...</div>;
  if (error)
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button className="btn btn-primary" onClick={refetch}>
          Reintentar
        </button>
      </div>
    );

  const clientName = (c) =>
    `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || '-';
  const bookingPassengerName = (booking) =>
    booking.client
      ? clientName(booking.client)
      : `${booking.passengerFirstName || ''} ${booking.passengerLastName || ''}`.trim() ||
        booking.passengerEmail ||
        '-';
  const passengerNames = (booking) =>
    booking.passengers?.length
      ? booking.passengers
          .map((passenger) => `${passenger.firstName} ${passenger.lastName}`.trim())
          .join(', ')
      : bookingPassengerName(booking);
  const viajeLabel = (v) =>
    v
      ? (v.journey?.origin?.name || '-') +
        ' -> ' +
        (v.journey?.destination?.name || '-') +
        ' (' +
        formatDate(tripDepartureDate(v)) +
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

      {isAdmin && (
        <form className="crud-form" onSubmit={handleSubmit} noValidate>
          <h2>Nueva Reserva</h2>
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
              aria-invalid={Boolean(formErrors.clientId)}
            >
              <option value="">-- Seleccionar cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientName(c)}
                </option>
              ))}
            </select>
            {formErrors.clientId && <span className="field-error">{formErrors.clientId}</span>}
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
              aria-invalid={Boolean(formErrors.tripId)}
            >
              <option value="">-- Seleccionar viaje --</option>
              {trips.map((v) => (
                <option key={v.id} value={v.id}>
                  {viajeLabel(v)}
                </option>
              ))}
            </select>
            {formErrors.tripId && <span className="field-error">{formErrors.tripId}</span>}
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
              aria-invalid={Boolean(formErrors.numSeats)}
            />
            {formErrors.numSeats && <span className="field-error">{formErrors.numSeats}</span>}
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
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={submitting}
            >
              <PlusIcon />
              {submitting ? 'Guardando...' : 'Crear reserva'}
            </button>
          </div>
        </form>
      )}

      <div className="crud-toolbar">
        <div className="crud-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={
              isAdmin
                ? 'Buscar por cliente o recorrido...'
                : 'Buscar por recorrido...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Reservada el</th>
              <th>Fecha del viaje</th>
              {isAdmin && <th>Cliente</th>}
              {isAdmin && <th>Pasajeros</th>}
              <th>Viaje</th>
              <th>Asientos</th>
              <th>Precio total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.createdAt)}</td>
                <td>{formatDate(tripDepartureDate(r.trip))}</td>
                {inlineDrafts[r.id] ? (
                  <>
                    {isAdmin && (
                      <td>
                        <select
                          className="inline-input"
                          value={inlineDrafts[r.id].clientId}
                          onChange={(e) =>
                            updateInlineDraft(r.id, 'clientId', e.target.value)
                          }
                        >
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {clientName(client)}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {isAdmin && <td className="passenger-list">Ver detalle al guardar</td>}
                    <td>
                      <select
                        className="inline-input"
                        value={inlineDrafts[r.id].tripId}
                        onChange={(e) =>
                          updateInlineDraft(r.id, 'tripId', e.target.value)
                        }
                      >
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {viajeLabel(trip)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="inline-input inline-number"
                        type="number"
                        min="1"
                        value={inlineDrafts[r.id].numSeats}
                        onChange={(e) =>
                          updateInlineDraft(r.id, 'numSeats', e.target.value)
                        }
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {isAdmin && (
                      <td>{bookingPassengerName(r)}</td>
                    )}
                    {isAdmin && <td className="passenger-list">{passengerNames(r)}</td>}
                    <td>{viajeLabel(r.trip)}</td>
                    <td>{r.numSeats}</td>
                  </>
                )}
                <td>${Number(r.price || 0).toLocaleString('es-AR')}</td>
                <td>
                  {inlineDrafts[r.id] ? (
                    <select
                      className="inline-input"
                      value={inlineDrafts[r.id].state}
                      onChange={(e) =>
                        updateInlineDraft(r.id, 'state', e.target.value)
                      }
                    >
                      {STATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`status-badge status-${r.state || 'pending'}`}
                    >
                      {STATE_LABEL[r.state] || r.state}
                    </span>
                  )}
                </td>
                <td className="actions">
                  {!isAdmin ? (
                    r.state === 'cancelled' ? (
                      <span className="status-badge badge-inactive">
                        Cancelada
                      </span>
                    ) : pendingCancel === r.id ? (
                      <>
                        <span className="confirm-msg">¿Cancelar reserva?</span>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleCancelBooking(r.id)}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setPendingCancel(null)}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleCancelBooking(r.id)}
                      >
                        Cancelar
                      </button>
                    )
                  ) : pendingDelete === r.id ? (
                    <>
                      <span className="confirm-msg">
                        ¿Eliminar esta reserva?
                      </span>
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
                      {inlineDrafts[r.id] ? (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={submitting}
                            onClick={() => saveInlineEdit(r)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            disabled={submitting}
                            onClick={() => cancelInlineEdit(r.id)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => startInlineEdit(r)}
                        >
                          Editar
                        </button>
                      )}
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
