import { useEffect, useMemo, useRef, useState } from 'react';
import { useVehicles } from '../hooks/useVehicles';
import { api } from '../services/api';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const VehiclesPage = () => {
  const { vehicles, loading, error, create, update, remove, refetch } = useVehicles();

  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ maxCapacity: '', categoryId: '1', hasBathroom: false });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bathroomFilter, setBathroomFilter] = useState('all');

  const msgTimer = useRef(null);

  const showMessage = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);
  useEffect(() => { api.vehicleCategories.getAll().then((res) => setCategories(res.data || [])).catch(() => setCategories([])); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const value = Number(form.maxCapacity);
    if (!form.maxCapacity.trim()) {
      showMessage('La capacidad maxima es obligatoria', 'error');
      return;
    }
    if (!Number.isInteger(value)) {
      showMessage('La capacidad debe ser un numero entero', 'error');
      return;
    }
    if (value < 1) {
      showMessage('La capacidad debe ser al menos 1', 'error');
      return;
    }
    if (value > 200) {
      showMessage('La capacidad no puede superar 200', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, maxCapacity: value };
      if (editingId) {
        await update(editingId, payload);
        showMessage('Vehiculo actualizado correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Vehiculo creado correctamente');
      }
      setForm({ maxCapacity: '', categoryId: '1', hasBathroom: false });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setPendingDelete(null);
    setForm({ maxCapacity: vehicle.maxCapacity || '', categoryId: String(vehicle.categoryId || vehicle.categoryRelation?.idCategoria || 1), hasBathroom: Boolean(vehicle.hasBathroom) });
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
        setForm({ maxCapacity: '', categoryId: '1', hasBathroom: false });
      }
      showMessage('Vehiculo eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ maxCapacity: '', categoryId: '1', hasBathroom: false });
  };

  const filtered = useMemo(() => {
    return vehicles.filter((vehicle) =>
      (categoryFilter === 'all' || String(vehicle.categoryId) === categoryFilter) &&
      (bathroomFilter === 'all' || Boolean(vehicle.hasBathroom) === (bathroomFilter === 'yes'))
    );
  }, [vehicles, categoryFilter, bathroomFilter]);

  if (loading) return <div className="loading">Cargando vehiculos...</div>;
  if (error) return (
    <div className="error">
      <p>Error: {error}</p>
      <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
    </div>
  );

  return (
    <div className="crud-page">
      <h1>Gestion de Vehiculos</h1>

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
        <h2>{editingId ? 'Editar Vehiculo' : 'Nuevo Vehiculo'}</h2>
        <div className="form-row">
          <input
            name="maxCapacity"
            type="number"
            min="1"
            max="200"
            placeholder="Capacidad maxima"
            value={form.maxCapacity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <label className="form-label" htmlFor="veh-category">Categoria</label>
          <select id="veh-category" name="categoryId" value={form.categoryId} onChange={handleChange} required>
            {categories.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombreCategoria} (${category.precioBase})</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">
            <input type="checkbox" name="hasBathroom" checked={form.hasBathroom} onChange={(e) => setForm({ ...form, hasBathroom: e.target.checked })} />
            Baño
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon" disabled={submitting}>
            <PlusIcon />
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear vehiculo'}
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
        <div className="crud-sort">
          <label htmlFor="veh-category-filter">Categoria</label>
          <select id="veh-category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas</option>
            {categories.map((category) => <option key={category.idCategoria} value={category.idCategoria}>{category.nombreCategoria}</option>)}
          </select>
        </div>
        <div className="crud-sort">
          <label htmlFor="veh-bathroom-filter">Baño</label>
          <select id="veh-bathroom-filter" value={bathroomFilter} onChange={(e) => setBathroomFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="yes">Con baño</option>
            <option value="no">Sin baño</option>
          </select>
        </div>
      </div>

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Capacidad Maxima</th>
              <th>Categoria (precio base)</th>
              <th>Baño</th>
              <th>En mantenimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>{v.maxCapacity} pasajeros</td>
                <td>{v.categoryRelation?.nombreCategoria || '-'} (${v.categoryRelation?.precioBase ?? '-'})</td>
                <td>{v.hasBathroom ? 'Si' : 'No'}</td>
                <td>
                  <input type="checkbox" checked={Boolean(v.maintenance)} onChange={(e) => update(v.id, { maxCapacity: v.maxCapacity, categoryId: v.categoryId, hasBathroom: Boolean(v.hasBathroom), maintenance: e.target.checked })} aria-label={`Mantenimiento vehiculo ${v.id}`} />
                </td>
                <td className="actions">
                  {pendingDelete === v.id ? (
                    <>
                      <span className="confirm-msg">¿Eliminar este vehiculo?</span>
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
          {vehicles.length === 0
            ? 'No hay vehiculos registrados.'
            : 'No se encontraron vehiculos con la busqueda actual.'}
        </p>
      )}
    </div>
  );
};

export default VehiclesPage;