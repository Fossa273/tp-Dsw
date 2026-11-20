import { useState, useCallback } from 'react';

export function useConfirmDelete() {
  const [pendingDelete, setPendingDelete] = useState(null);

  const requestDelete = useCallback((id) => {
    setPendingDelete(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmDelete = useCallback((callback) => {
    return async (id) => {
      if (pendingDelete !== id) {
        requestDelete(id);
        return;
      }
      cancelDelete();
      await callback(id);
    };
  }, [pendingDelete, requestDelete, cancelDelete]);

  return { pendingDelete, requestDelete, cancelDelete, confirmDelete };
}
