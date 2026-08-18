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
    setProvincias((prev) => [...prev, res]);
    return res;
  };

  const update = async (id, provincia) => {
    const res = await api.provincias.update(id, provincia);
    setProvincias((prev) => prev.map((p) => (p.id === id ? res : p)));
    return res;
  };

  const remove = async (id) => {
    await api.provincias.delete(id);
    setProvincias((prev) => prev.filter((p) => p.id !== id));
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
