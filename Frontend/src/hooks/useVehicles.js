/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refetch keeps the page mounted (loading is only toggled on the
  // initial load) so CRUD operations do not produce a screen flash.
  const fetchAll = useCallback(async () => {
    try {
      const res = await api.vehicles.getAll();
      setVehicles(res.data || []);
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

  const create = async (vehicle) => {
    const res = await api.vehicles.create(vehicle);
    await fetchAll();
    return res;
  };

  const update = async (id, vehicle) => {
    const res = await api.vehicles.update(id, vehicle);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.vehicles.delete(id);
    await fetchAll();
  };

  return {
    vehicles,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}