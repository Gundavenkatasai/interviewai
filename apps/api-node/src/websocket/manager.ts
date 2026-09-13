import { WebSocket } from "ws";
import { ServerEvent } from "./types";
import { InterviewSession } from "../modules/interview/interview.model";

interface ConnectionMetadata {
  socket: WebSocket;
  isAlive: boolean;
  sequence: number;
}

export class WebSocketManager {
  private static connections = new Map<string, ConnectionMetadata>();
  private static pingInterval: NodeJS.Timeout | null = null;

  static initializeHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.connections.forEach((meta, sessionId) => {
        if (!meta.isAlive) {
          meta.socket.terminate();
          this.connections.delete(sessionId);
          return;
        }
        meta.isAlive = false;
        meta.socket.ping();
      });
    }, 30000);
  }

  static addConnection(sessionId: string, socket: WebSocket) {
    // If an existing connection is there, close it to enforce single-tab authority
    const existing = this.connections.get(sessionId);
    if (existing && existing.socket.readyState === WebSocket.OPEN) {
      existing.socket.close(1008, "New connection established from another tab");
    }

    this.connections.set(sessionId, {
      socket,
      isAlive: true,
      sequence: 0,
    });

    socket.on("pong", () => {
      const meta = this.connections.get(sessionId);
      if (meta) meta.isAlive = true;
    });

    socket.on("close", () => {
      const meta = this.connections.get(sessionId);
      if (meta && meta.socket === socket) {
        this.connections.delete(sessionId);
      }
    });
  }

  static removeConnection(sessionId: string) {
    const meta = this.connections.get(sessionId);
    if (meta) {
      meta.socket.terminate();
      this.connections.delete(sessionId);
    }
  }

  static async sendToSession(
    sessionId: string,
    eventType: string,
    payload?: any,
    correlationId?: string
  ) {
    const meta = this.connections.get(sessionId);
    if (meta && meta.socket.readyState === WebSocket.OPEN) {
      // Get the latest sequence from the database or just use in-memory sequence for performance.
      // We will increment and save it asynchronously to avoid blocking the event loop.
      meta.sequence += 1;
      
      const event: ServerEvent = {
        sequence: meta.sequence,
        type: eventType,
        timestamp: new Date().toISOString(),
        correlationId,
        payload,
      };

      meta.socket.send(JSON.stringify(event));

      // Asynchronously update sequence in db
      InterviewSession.updateOne(
        { _id: sessionId },
        { lastSequence: meta.sequence }
      ).catch((err) => console.error("Failed to update sequence in DB", err));
    }
  }

  static broadcast(eventType: string, payload: any) {
    for (const [sessionId, meta] of this.connections.entries()) {
      if (meta.socket.readyState === WebSocket.OPEN) {
        meta.sequence += 1;
        const event: ServerEvent = {
          sequence: meta.sequence,
          type: eventType,
          timestamp: new Date().toISOString(),
          payload,
        };
        meta.socket.send(JSON.stringify(event));
      }
    }
  }
}

// Start heartbeat globally
WebSocketManager.initializeHeartbeat();
