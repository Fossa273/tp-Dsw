/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useClients(page, limit = 50) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refetch keeps the page mounted (loading is only toggled on the
  // initial load) so CRUD operations do not produce a screen flash.
  const fetchAll = useCallback(async () => {
    try {
      const res = await api.clients.getAll(page ? { page, limit } : {});
      setClients(res.data || []);
      setPagination(res.totalPages ? res : null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (client) => {
    const res = await api.clients.create(client);
    await fetchAll();
    return res;
  };

  const update = async (id, client) => {
    const res = await api.clients.update(id, client);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.clients.delete(id);
    await fetchAll();
  };

  return { clients, pagination, loading, error, create, update, remove, refetch: fetchAll };
}