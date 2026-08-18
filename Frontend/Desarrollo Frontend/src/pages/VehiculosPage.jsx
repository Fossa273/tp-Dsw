import { useState } from 'react';
import { useVehiculos } from '../hooks/useVehiculos';

const VehiculosPage = () => {
  const { vehiculos, loading, error, create, update, remove } = useVehiculos();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ capacidadmax: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { capacidadmax: Number(form.capacidadmax) };
      if (editingId) {
        await update(editingId, payload);
        setEditingId(null);
      } else {
        await create(payload);
      }
      setForm({ capacidadmax: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (vehiculo) => {
    setEditingId(vehiculo.id);
    setForm({ capacidadmax: vehiculo.capacidadmax || '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar este vehiculo?')) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ capacidadmax: '' });
  };

  if (loading) return <div className="loading">Cargando vehiculos...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Vehiculos</h1>

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar Vehiculo' : 'Nuevo Vehiculo'}</h2>
        <div className="form-row">
          <input
            name="capacidadmax"
            type="number"
            min="1"
            placeholder="Capacidad maxima"
            value={form.capacidadmax}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Actualizar' : 'Crear'}
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

      <div className="crud-table-wrapper">
        <table className="crud-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Capacidad Maxima</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.capacidadmax} pasajeros</td>
                <td className="actions">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vehiculos.length === 0 && (
        <p className="empty-msg">No hay vehiculos registrados.</p>
      )}
    </div>
  );
};

export default VehiculosPage;
