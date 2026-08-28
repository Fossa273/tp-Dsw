/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useProvinces() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refetch keeps the page mounted (loading is only toggled on the
  // initial load) so CRUD operations do not produce a screen flash.
  const fetchAll = useCallback(async () => {
    try {
      const res = await api.provinces.getAll();
      setProvinces(res.data || []);
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

  const create = async (province) => {
    const res = await api.provinces.create(province);
    await fetchAll();
    return res;
  };

  const update = async (id, province) => {
    const res = await api.provinces.update(id, province);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.provinces.delete(id);
    await fetchAll();
  };

  return {
    provinces,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}