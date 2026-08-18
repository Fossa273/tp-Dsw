import { useState } from 'react';
import { useLocalidades } from '../hooks/useLocalidades';

const LocalidadesPage = () => {
  const { localidades, loading, error, create, update, remove } =
    useLocalidades();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await update(editingId, form);
        setEditingId(null);
      } else {
        await create(form);
      }
      setForm({ nombre: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (localidad) => {
    setEditingId(localidad.id);
    setForm({ nombre: localidad.nombre || '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar esta localidad?')) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ nombre: '' });
  };

  if (loading) return <div className="loading">Cargando localidades...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Localidades</h1>

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar Localidad' : 'Nueva Localidad'}</h2>
        <div className="form-row">
          <input
            name="nombre"
            placeholder="Nombre de la localidad"
            value={form.nombre}
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
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {localidades.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.nombre}</td>
                <td className="actions">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {localidades.length === 0 && (
        <p className="empty-msg">No hay localidades registradas.</p>
      )}
    </div>
  );
};

export default LocalidadesPage;
