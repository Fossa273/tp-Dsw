/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useLocalidades() {
  const [localidades, setLocalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.localidades.getAll();
      setLocalidades(res.data || []);
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

  const create = async (localidad) => {
    const res = await api.localidades.create(localidad);
    setLocalidades((prev) => [...prev, res]);
    return res;
  };

  const update = async (id, localidad) => {
    const res = await api.localidades.update(id, localidad);
    setLocalidades((prev) => prev.map((l) => (l.id === id ? res : l)));
    return res;
  };

  const remove = async (id) => {
    await api.localidades.delete(id);
    setLocalidades((prev) => prev.filter((l) => l.id !== id));
  };

  return {
    localidades,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}
