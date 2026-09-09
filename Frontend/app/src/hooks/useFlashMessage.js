import { useEffect, useRef, useState, useCallback } from 'react';

export function useFlashMessage(timeout = 4000) {
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showMessage = useCallback((text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), timeout);
  }, [timeout]);

  return { msg, msgType, showMessage };
}
