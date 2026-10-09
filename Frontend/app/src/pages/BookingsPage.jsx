import { useEffect, useMemo, useRef, useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';
import { useTrips } from '../hooks/useTrips';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CloseIcon, MailIcon, PencilIcon, PlusIcon } from '../components/icons';
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
  const [page, setPage] = useState(1);
  const { bookings, pagination, loading, error, create, update, remove, refetch } =
    useBookings(isAdmin ? undefined : user?.id, page, 50);
  const { clients, loading: loadingClients } = useClients();
  const { trips, loading: loadingTrips } = useTrips();

  const [form, setForm] = useState({
    clientId: '',
    tripId: '',
    numSeats: '',
    state: 'pending',
  });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingState, setEditingState] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ subject: '', body: '' });
  const [templateFiles, setTemplateFiles] = useState([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [search, setSearch] = useState('');
  const [visibleStates, setVisibleStates] = useState({
    pending: true,
    confirmed: true,
    cancelled: true,
  });
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

  useEffect(() => {
    if (!isAdmin) return;
    api.bookings.getEmailTemplate()
      .then((template) => {
        setEmailTemplate(template);
        setTemplateForm({ subject: template.subject, body: template.body });
      })
      .catch((err) => showMessage(err.message, 'error'));
  }, [isAdmin]);

  const saveEmailTemplate = async (event) => {
    event.preventDefault();
    try {
      setSavingTemplate(true);
      const saved = await api.bookings.updateEmailTemplate({
        ...templateForm,
        attachments: templateFiles,
      });
      setEmailTemplate(saved);
      setTemplateFiles([]);
      event.target.reset();
      showMessage('Mensaje de confirmacion actualizado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteEmailAttachment = async (id) => {
    try {
      const saved = await api.bookings.deleteEmailAttachment(id);
      if (saved) {
        const template = await api.bookings.getEmailTemplate();
        setEmailTemplate(template);
      }
      showMessage('Adjunto eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

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

  const handleStateChange = async (booking, state) => {
    if (state === booking.state || submitting) return;
    try {
      setSubmitting(true);
      const result = await update(booking.id, { state });
      showMessage(
        result?.warning || 'Estado de la reserva actualizado correctamente',
        result?.warning ? 'error' : 'success',
      );
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startStateEdit = (booking) => {
    setPendingDelete(null);
    setEditingState({ id: booking.id, state: booking.state || 'pending' });
  };

  const cancelStateEdit = () => {
    setEditingState(null);
  };

  const saveStateEdit = async (booking) => {
    if (!editingState) return;
    await handleStateChange(booking, editingState.state);
    setEditingState(null);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((r) => {
      if (!visibleStates[r.state || 'pending']) return false;
      if (!term) return true;
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
  }, [bookings, search, visibleStates]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
    setPendingDelete(null);
    setPendingCancel(null);
    setEditingState(null);
  };

  if (loading && bookings.length === 0) {
    return <div className="loading">Cargando reservas...</div>;
  }

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
    <div className="crud-page bookings-page">
      <div className="crud-heading">
        <h1>Gestion de Reservas</h1>
        {isAdmin && (
          <div className="crud-heading-actions">
            <button
              type="button"
              className="btn btn-primary btn-icon-only"
              aria-label={showCreateForm ? 'Cerrar formulario de reserva' : 'Crear nueva reserva'}
              title={showCreateForm ? 'Cerrar formulario' : 'Crear nueva reserva'}
              onClick={() => setShowCreateForm((current) => !current)}
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              className="btn btn-primary btn-icon-only"
              aria-label={showEmailTemplate ? 'Cerrar mensaje de confirmacion' : 'Editar mensaje de confirmacion'}
              title={showEmailTemplate ? 'Cerrar mensaje' : 'Editar mensaje de confirmacion'}
              onClick={() => setShowEmailTemplate((current) => !current)}
            >
              <MailIcon />
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`crud-message ${
            msgType === 'error' ? 'msg-error' : 'msg-success'
          }`}
        >
          {msg}
        </div>
      )}

      {isAdmin && emailTemplate && showEmailTemplate && (
        <form className="crud-form booking-email-template" onSubmit={saveEmailTemplate}>
          <h2>Mensaje de confirmacion por email</h2>
          <p className="profile-section-desc">
            Se enviara unicamente cuando una reserva pase al estado Confirmada.
            Variables disponibles: {'{{clientName}}'}, {'{{bookingId}}'}, {'{{origin}}'},
            {'{{destination}}'}, {'{{departure}}'}, {'{{seats}}'} y {'{{price}}'}.
          </p>
          <div className="form-row">
            <label className="form-label" htmlFor="booking-email-subject">Asunto</label>
            <input
              id="booking-email-subject"
              value={templateForm.subject}
              onChange={(event) => setTemplateForm({ ...templateForm, subject: event.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="booking-email-body">Mensaje</label>
            <textarea
              id="booking-email-body"
              rows="9"
              value={templateForm.body}
              onChange={(event) => setTemplateForm({ ...templateForm, body: event.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="booking-email-files">Adjuntos</label>
            <input
              id="booking-email-files"
              type="file"
              multiple
              onChange={(event) => setTemplateFiles(Array.from(event.target.files || []))}
            />
          </div>
          {emailTemplate.attachments?.length > 0 && (
            <ul className="booking-email-attachments">
              {emailTemplate.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <span>{attachment.filename}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-delete"
                    onClick={() => deleteEmailAttachment(attachment.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingTemplate}>
              {savingTemplate ? 'Guardando...' : 'Guardar mensaje'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="crud-message msg-error booking-connection-message" role="alert">
          <span>No se pudo actualizar la lista de reservas: {error}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={refetch}>
            Reintentar
          </button>
        </div>
      )}

      {isAdmin && showCreateForm && (
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
        <div className="booking-filters" aria-label="Filtrar reservas por estado">
          <span className="booking-filters-label">Mostrar:</span>
          {STATE_OPTIONS.map((option) => (
            <label className="booking-filter" key={option.value}>
              <input
                type="checkbox"
                checked={visibleStates[option.value]}
                onChange={() =>
                  setVisibleStates((current) => ({
                    ...current,
                    [option.value]: !current[option.value],
                  }))
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table bookings-table">
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
                {isAdmin && <td>{bookingPassengerName(r)}</td>}
                {isAdmin && <td className="passenger-list">{passengerNames(r)}</td>}
                <td>{viajeLabel(r.trip)}</td>
                <td>{r.numSeats}</td>
                <td>${Number(r.price || 0).toLocaleString('es-AR')}</td>
                <td>
                  {isAdmin && editingState?.id === r.id ? (
                    <select
                      className="inline-input booking-state-select"
                      value={editingState.state}
                      onChange={(event) =>
                        setEditingState((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      disabled={submitting}
                      aria-label={`Estado de la reserva ${r.id}`}
                    >
                      {STATE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-badge status-${r.state || 'pending'}`}>
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
                      {editingState?.id === r.id ? (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={submitting}
                            onClick={() => saveStateEdit(r)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            disabled={submitting}
                            onClick={cancelStateEdit}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-edit btn-icon-only"
                          aria-label="Editar estado de reserva"
                          title="Editar estado de reserva"
                          onClick={() => startStateEdit(r)}
                        >
                          <PencilIcon />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-delete btn-icon-only"
                        aria-label="Eliminar reserva"
                        title="Eliminar reserva"
                        onClick={() => handleDelete(r.id)}
                      >
                        <CloseIcon />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <nav className="pagination" aria-label="Paginacion de reservas">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Pagina {pagination.page} de {pagination.totalPages}
            <small> ({pagination.total} reservas)</small>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page === pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Siguiente
          </button>
        </nav>
      )}

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
