/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.trips.getAll();
      setTrips(res.data || []);
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
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}