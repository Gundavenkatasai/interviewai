import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8001";

export interface WebSocketEvent {
  sequence: number;
  type: string;
  timestamp: string;
  correlationId?: string;
  payload?: any;
}

export type ConnectionState = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export function useWebSocket(
  sessionId: string | null,
  onEvent?: (event: WebSocketEvent) => void
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!sessionId) return;
    
    setConnectionState(prev => prev === "DISCONNECTED" ? "CONNECTING" : "RECONNECTING");

    try {
      const token = localStorage.getItem("interviewai_token");
      const wsUrl = `${WS_BASE}/ws/interview/${sessionId}${token ? `?token=${token}` : ""}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) return;
        setConnectionState("CONNECTED");
        reconnectAttempts.current = 0;
        
        // Always request state sync upon successful connection
        sendEvent("STATE_SYNC_REQUEST", {});
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEventRef.current?.(data);
        } catch {}
      };

      ws.onclose = () => {
        if (socketRef.current !== ws) return;
        setConnectionState("DISCONNECTED");
        
        // Exponential backoff reconnect
        const baseDelay = 1000;
        const maxDelay = 30000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
        reconnectAttempts.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = () => {
        // close will be fired immediately after error
      };
    } catch {}
  }, [sessionId]);

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

  const sendEvent = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const envelope = {
        eventId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        type,
        interviewId: sessionId,
        timestamp: new Date().toISOString(),
        payload
      };
      socketRef.current.send(JSON.stringify(envelope));
    }
  }, [sessionId]);

  return { connectionState, sendEvent };
}
