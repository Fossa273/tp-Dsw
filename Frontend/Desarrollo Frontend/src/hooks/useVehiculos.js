/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.vehiculos.getAll();
      setVehiculos(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (vehiculo) => {
    const res = await api.vehiculos.create(vehiculo);
    await fetchAll();
    return res;
  };

  const update = async (id, vehiculo) => {
    const res = await api.vehiculos.update(id, vehiculo);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.vehiculos.delete(id);
    await fetchAll();
  };

  return {
    vehiculos,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}
