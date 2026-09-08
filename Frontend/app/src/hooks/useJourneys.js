/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useJourneys() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactive, setInactive] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.journeys.getAll();
      setJourneys(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInactive = useCallback(async () => {
    try {
      const res = await api.journeys.getInactive();
      setInactive(res.data || []);
    } catch {
      setInactive([]);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchInactive();
  }, [fetchAll, fetchInactive]);

  const create = async (journey) => {
    const res = await api.journeys.create(journey);
    await fetchAll();
    return res;
  };

  const update = async (id, journey) => {
    const res = await api.journeys.update(id, journey);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.journeys.delete(id);
    await fetchAll();
  };

  const reactivate = async (id) => {
    await api.journeys.reactivate(id);
    await Promise.all([fetchAll(), fetchInactive()]);
  };

  return {
    journeys,
    inactive,
    loading,
    error,
    create,
    update,
    remove,
    reactivate,
    fetchInactive,
    refetch: fetchAll,
  };
}