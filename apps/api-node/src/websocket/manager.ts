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
    questionId?: string,
    correlationId?: string
  ) {
    const meta = this.connections.get(sessionId);
    if (meta && meta.socket.readyState === WebSocket.OPEN) {
      meta.sequence += 1;

      // Asynchronously fetch current state version
      let stateVersion = 1;
      try {
        const sess = await InterviewSession.findById(sessionId).select("stateVersion currentQuestionId");
        if (sess) {
          stateVersion = sess.stateVersion || 1;
          if (!questionId && sess.currentQuestionId) {
            questionId = sess.currentQuestionId;
          }
        }
      } catch (_) {}

      const event: ServerEvent = {
        type: eventType,
        sessionId,
        sequence: meta.sequence,
        stateVersion,
        questionId,
        timestamp: new Date().toISOString(),
        correlationId,
        payload,
      };

      meta.socket.send(JSON.stringify(event));

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
          type: eventType,
          sessionId,
          sequence: meta.sequence,
          stateVersion: 1,
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
