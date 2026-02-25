import { useState, useEffect, useRef } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://1.1.1.1', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (mountedRef.current) setIsConnected(true);
      } catch {
        if (mountedRef.current) setIsConnected(false);
      }
    };

    check();
    const interval = setInterval(check, 10000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}
