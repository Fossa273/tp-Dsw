/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useLocalities(page, limit = 50) {
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Refetch keeps the page mounted (loading is only toggled on the
  // initial load) so CRUD operations do not produce a screen flash.
  const fetchAll = useCallback(async () => {
    try {
      const res = await api.localities.getAll(page ? { page, limit } : {});
      setLocalities(res.data || []);
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

  const create = async (locality) => {
    const res = await api.localities.create(locality);
    await fetchAll();
    return res;
  };

  const update = async (id, locality) => {
    const res = await api.localities.update(id, locality);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.localities.delete(id);
    await fetchAll();
  };

  return {
    localities,
    pagination,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}