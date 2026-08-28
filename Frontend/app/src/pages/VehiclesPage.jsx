import { useMemo, useState } from 'react';
import { useVehicles } from '../hooks/useVehicles';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'capacity-asc', label: 'Capacidad (menor a mayor)' },
  { value: 'capacity-desc', label: 'Capacidad (mayor a menor)' },
];

const VehiclesPage = () => {
  const { vehicles, loading, error, create, update, remove } = useVehicles();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ maxCapacity: '' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('capacity-asc');

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
      const payload = { maxCapacity: value };
      if (editingId) {
        await update(editingId, payload);
        showMessage('Vehiculo actualizado correctamente');
        setEditingId(null);
      } else {
        await create(payload);
        showMessage('Vehiculo creado correctamente');
      }
      setForm({ maxCapacity: '' });
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setPendingDelete(null);
    setForm({ maxCapacity: vehicle.maxCapacity || '' });
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
        setForm({ maxCapacity: '' });
      }
      showMessage('Vehiculo eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ maxCapacity: '' });
  };

  const filtered = useMemo(() => {
    const term = search.trim();
    let result = vehicles;
    if (term) {
      const num = Number(term);
      if (!Number.isNaN(num)) {
        result = result.filter((v) => v.maxCapacity === num);
      } else {
        result = result.filter((v) =>
          String(v.maxCapacity).includes(term.toLowerCase())
        );
      }
    }
    const sorted = [...result];
    switch (sort) {
      case 'capacity-asc':
        sorted.sort((a, b) => Number(a.maxCapacity) - Number(b.maxCapacity));
        break;
      case 'capacity-desc':
        sorted.sort((a, b) => Number(b.maxCapacity) - Number(a.maxCapacity));
        break;
      default:
        break;
    }
    return sorted;
  }, [vehicles, search, sort]);

  if (loading) return <div className="loading">Cargando vehiculos...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-icon">
            <PlusIcon />
            {editingId ? 'Actualizar' : 'Crear vehiculo'}
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
            placeholder="Buscar por capacidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="crud-sort">
          <label htmlFor="veh-sort">Ordenar</label>
          <select id="veh-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
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
              <th>Capacidad Maxima</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>{v.maxCapacity} pasajeros</td>
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