/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useBookings(clientId, page = 1, limit = 50) {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.bookings.getAll(clientId, { page, limit });
      setBookings(res.data || []);
      setPagination({
        page: res.page || page,
        limit: res.limit || limit,
        total: res.total || 0,
        totalPages: res.totalPages || 1,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, page, limit]);

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

  const retry = async () => {
    await fetchAll();
  };

  return {
    bookings,
    pagination,
    loading,
    error,
    create,
    update,
    remove,
    refetch: retry,
  };
}
