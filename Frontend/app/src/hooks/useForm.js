import { useState, useCallback } from 'react';

export function useForm(initialState) {
  const [form, setForm] = useState(initialState);

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  return { form, setForm, handleChange, resetForm };
}
