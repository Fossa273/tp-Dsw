/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useTrips(page, limit = 50) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.trips.getAll(page ? { page, limit } : {});
      setTrips(res.data || []);
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

  const create = async (trip) => {
    const res = await api.trips.create(trip);
    await fetchAll();
    return res;
  };

  const update = async (id, trip) => {
    const res = await api.trips.update(id, trip);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.trips.delete(id);
    await fetchAll();
  };

  return {
    trips,
    pagination,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}