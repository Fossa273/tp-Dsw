import { useState } from 'react';
import { useProvincias } from '../hooks/useProvincias';

const ProvinciasPage = () => {
  const { provincias, loading, error, create, update, remove } =
    useProvincias();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombreprov: '' });

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
      setForm({ nombreprov: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (provincia) => {
    setEditingId(provincia.id);
    setForm({ nombreprov: provincia.nombreprov || '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar esta provincia?')) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ nombreprov: '' });
  };

  if (loading) return <div className="loading">Cargando provincias...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Provincias</h1>

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar Provincia' : 'Nueva Provincia'}</h2>
        <div className="form-row">
          <input
            name="nombreprov"
            placeholder="Nombre de la provincia"
            value={form.nombreprov}
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
            {provincias.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombreprov}</td>
                <td className="actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(p.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {provincias.length === 0 && (
        <p className="empty-msg">No hay provincias registradas.</p>
      )}
    </div>
  );
};

export default ProvinciasPage;
