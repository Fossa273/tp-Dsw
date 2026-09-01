/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.bookings.getAll();
      setBookings(res.data || []);
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

  const create = async (booking) => {
    const res = await api.bookings.create(booking);
    await fetchAll();
    return res;
  };

  const update = async (id, booking) => {
    const res = await api.bookings.update(id, booking);
    await fetchAll();
    return res;
  };

  const remove = async (id) => {
    await api.bookings.delete(id);
    await fetchAll();
  };

  return {
    bookings,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}