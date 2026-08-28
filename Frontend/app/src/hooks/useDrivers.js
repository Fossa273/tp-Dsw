/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.drivers.getAll();
      setDrivers(res.data || []);
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

  const create = async (driver) => {
    const res = await api.drivers.create(driver);
    await fetchAll();
    return res;
  };

  const update = async (id, driver) => {
    const res = await api.drivers.update(id, driver);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.drivers.delete(id);
    await fetchAll();
  };

  return { drivers, loading, error, create, update, remove, refetch: fetchAll };
}
