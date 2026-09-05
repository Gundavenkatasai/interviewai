"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";

export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export function useWebSocket(
  sessionId: string | null,
  onEvent?: (event: WebSocketEvent) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    try {
      const wsUrl = `${WS_BASE}/ws/interview/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent?.(data);
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic reconnection attempt after 3s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {}
  }, [sessionId, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        typeof message === "string" ? message : JSON.stringify(message)
      );
    }
  }, []);

  return { isConnected, send };
}
