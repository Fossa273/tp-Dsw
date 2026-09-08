/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { api } from '../services/api';

const VehicleCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({});
  const [message, setMessage] = useState(null);
  const [historyCategory, setHistoryCategory] = useState(null);

  const load = async () => {
    try {
      const response = await api.vehicleCategories.getAll();
      setCategories(response.data || []);
      setValues(Object.fromEntries((response.data || []).map((category) => [category.idCategoria, category.precioBase])));
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };
  useEffect(() => { load(); }, []);

  const save = async (category) => {
    const current = Number(category.precioBase);
    const next = Number(values[category.idCategoria]);
    if (!Number.isFinite(next) || next < 0) {
      setMessage({ type: 'error', text: 'El precio base debe ser un numero mayor o igual a 0' });
      return;
    }
    if (!window.confirm(`Vas a cambiar el precio base de ${category.nombreCategoria} de $${current} a $${next}. ¿Deseas guardar este cambio?`)) return;
    try {
      await api.vehicleCategories.updatePrice(category.idCategoria, next);
      setMessage({ type: 'success', text: 'Precio base actualizado y registrado en el historial.' });
      await load();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };

  return <div className="crud-page">
    <h1>Precios de categorias de vehiculos</h1>
    {message && <div className={`crud-message ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>{message.text}</div>}
    <div className="crud-table-wrapper"><table className="crud-table"><thead><tr><th>Categoria</th><th>Precio base vigente</th><th>Historial</th><th>Accion</th></tr></thead><tbody>
      {categories.map((category) => <tr key={category.idCategoria}>
        <td>{category.nombreCategoria}</td>
        <td><input type="number" min="0" step="0.01" value={values[category.idCategoria] ?? ''} onChange={(event) => setValues({ ...values, [category.idCategoria]: event.target.value })} /></td>
        <td>{(category.priceHistory || []).slice(0, 3).map((entry) => <div key={entry.id}>${entry.precioBase} ({new Date(entry.createdAt).toLocaleDateString('es-AR')})</div>)}</td>
        <td>
          <button className="btn btn-sm btn-secondary" onClick={() => setHistoryCategory(category)}>Ver historial completo</button>
          <button className="btn btn-sm btn-primary" onClick={() => save(category)}>Guardar precio</button>
        </td>
      </tr>)}
    </tbody></table></div>
    {historyCategory && <div className="modal-backdrop" role="presentation" onClick={() => setHistoryCategory(null)}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Historial de {historyCategory.nombreCategoria}</h2>
        <div className="crud-table-wrapper"><table className="crud-table"><thead><tr><th>Precio base</th><th>Fecha</th></tr></thead><tbody>
          {(historyCategory.priceHistory || []).map((entry) => <tr key={entry.id}><td>${entry.precioBase}</td><td>{new Date(entry.createdAt).toLocaleString('es-AR')}</td></tr>)}
        </tbody></table></div>
        <button className="btn btn-secondary" onClick={() => setHistoryCategory(null)}>Cerrar</button>
      </div>
    </div>}
  </div>;
};

export default VehicleCategoriesPage;
