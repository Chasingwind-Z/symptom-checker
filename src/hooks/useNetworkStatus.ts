import { useCallback, useEffect, useRef, useState } from 'react';

const RECONNECT_NOTICE_DURATION_MS = 6000;

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [showReconnectNotice, setShowReconnectNotice] = useState(false);
  const reconnectTimerRef = useRef<number | null>(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current === null) {
      return;
    }

    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }, []);

  const dismissReconnectNotice = useCallback(() => {
    clearReconnectTimer();
    setShowReconnectNotice(false);
  }, [clearReconnectTimer]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectNotice(true);
      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        setShowReconnectNotice(false);
      }, RECONNECT_NOTICE_DURATION_MS);
    };

    const handleOffline = () => {
      setIsOnline(false);
      dismissReconnectNotice();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearReconnectTimer();
    };
  }, [clearReconnectTimer, dismissReconnectNotice]);

  return {
    isOnline,
    showReconnectNotice,
    dismissReconnectNotice,
  };
}
