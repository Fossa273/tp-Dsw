import { useState } from 'react';
import { useClientes } from '../hooks/useClientes';

const ClientesPage = () => {
  const { clientes, loading, error, create, update, remove } = useClientes();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });

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
      setForm({ nombre: '', apellido: '', email: '', telefono: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setForm({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar este cliente?')) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ nombre: '', apellido: '', email: '', telefono: '' });
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="crud-page">
      <h1>Gestion de Clientes</h1>

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
        <div className="form-row">
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <input
            name="apellido"
            placeholder="Apellido"
            value={form.apellido}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="telefono"
            placeholder="Telefono"
            value={form.telefono}
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
              <th>Apellido</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.apellido}</td>
                <td>{c.email}</td>
                <td>{c.telefono}</td>
                <td className="actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(c)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(c.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clientes.length === 0 && (
        <p className="empty-msg">No hay clientes registrados.</p>
      )}
    </div>
  );
};

export default ClientesPage;
