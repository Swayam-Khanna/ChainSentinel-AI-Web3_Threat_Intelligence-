import { useEffect, useRef, useCallback, useState } from 'react';
import { ConnectionStatus } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
const RECONNECT_DELAY = 3000;

export function useWebSocket(onMessage: (msg: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log('[WS] Connecting to', WS_URL);
    setStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setStatus('open');
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessageRef.current(parsed);
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting...');
        setStatus('closed');
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}
