/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useProvincias() {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.provincias.getAll();
      setProvincias(res.data || []);
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

  const create = async (provincia) => {
    const res = await api.provincias.create(provincia);
    await fetchAll();
    return res;
  };

  const update = async (id, provincia) => {
    const res = await api.provincias.update(id, provincia);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.provincias.delete(id);
    await fetchAll();
  };

  return {
    provincias,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}
