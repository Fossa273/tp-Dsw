/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.clientes.getAll();
      setClientes(res.data || []);
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

  const create = async (cliente) => {
    const res = await api.clientes.create(cliente);
    setClientes((prev) => [...prev, res]);
    return res;
  };

  const update = async (id, cliente) => {
    const res = await api.clientes.update(id, cliente);
    setClientes((prev) => prev.map((c) => (c.id === id ? res : c)));
    return res;
  };

  const remove = async (id) => {
    await api.clientes.delete(id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return { clientes, loading, error, create, update, remove, refetch: fetchAll };
}
