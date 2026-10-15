/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/format';

const VehicleCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({});
  const [message, setMessage] = useState(null);
  const [historyCategory, setHistoryCategory] = useState(null);

  const load = async () => {
    try {
      const response = await api.vehicleCategories.getAll();
      setCategories(response.data || []);
      setValues(Object.fromEntries((response.data || []).map((category) => [
        category.idCategoria,
        { precioBase: category.precioBase, litrosPorKm: category.litrosPorKm },
      ])));
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };
  useEffect(() => { load(); }, []);

  const setCategoryValue = (categoryId, key, value) => {
    setValues({
      ...values,
      [categoryId]: { ...values[categoryId], [key]: value },
    });
  };

  const save = async (category) => {
    const precioBase = Number(values[category.idCategoria]?.precioBase);
    const litrosPorKm = Number(values[category.idCategoria]?.litrosPorKm);
    if (!Number.isFinite(precioBase) || precioBase < 0) {
      setMessage({ type: 'error', text: 'El precio base debe ser un numero mayor o igual a 0' });
      return;
    }
    if (!Number.isFinite(litrosPorKm) || litrosPorKm <= 0) {
      setMessage({ type: 'error', text: 'El consumo debe ser un numero mayor a 0 litros por kilometro' });
      return;
    }
    if (!window.confirm(`Vas a actualizar el precio base y el consumo de ${category.nombreCategoria}. ¿Deseas guardar estos cambios?`)) return;
    try {
      await api.vehicleCategories.updateSettings(category.idCategoria, { precioBase, litrosPorKm });
      setMessage({ type: 'success', text: 'Precio base y consumo actualizados.' });
      await load();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };

  return <div className="crud-page">
    <h1>Categorias de vehiculos</h1>
    {message && <div className={`crud-message ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>{message.text}</div>}
    <div className="crud-table-wrapper"><table className="crud-table"><thead><tr><th>Categoria</th><th>Precio base vigente</th><th>Consumo (L/km)</th><th>Historial de precios</th><th>Accion</th></tr></thead><tbody>
      {categories.map((category) => <tr key={category.idCategoria}>
        <td>{category.nombreCategoria}</td>
        <td><input type="number" min="0" step="0.01" value={values[category.idCategoria]?.precioBase ?? ''} onChange={(event) => setCategoryValue(category.idCategoria, 'precioBase', event.target.value)} /></td>
        <td><input type="number" min="0.0001" step="0.01" value={values[category.idCategoria]?.litrosPorKm ?? ''} onChange={(event) => setCategoryValue(category.idCategoria, 'litrosPorKm', event.target.value)} /></td>
        <td>{(category.priceHistory || []).slice(0, 3).map((entry) => <div key={entry.id}>${entry.precioBase} ({formatDate(entry.createdAt)})</div>)}</td>
        <td>
          <button className="btn btn-sm btn-secondary" onClick={() => setHistoryCategory(category)}>Ver historial completo</button>
          <button className="btn btn-sm btn-primary" onClick={() => save(category)}>Guardar cambios</button>
        </td>
      </tr>)}
    </tbody></table></div>
    {historyCategory && <div className="modal-backdrop" role="presentation" onClick={() => setHistoryCategory(null)}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Historial de {historyCategory.nombreCategoria}</h2>
        <div className="crud-table-wrapper"><table className="crud-table"><thead><tr><th>Precio base</th><th>Fecha</th></tr></thead><tbody>
          {(historyCategory.priceHistory || []).map((entry) => <tr key={entry.id}><td>${entry.precioBase}</td><td>{formatDate(entry.createdAt)}</td></tr>)}
        </tbody></table></div>
        <button className="btn btn-secondary" onClick={() => setHistoryCategory(null)}>Cerrar</button>
      </div>
    </div>}
  </div>;
};

export default VehicleCategoriesPage;
