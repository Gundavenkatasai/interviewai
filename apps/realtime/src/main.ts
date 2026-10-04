import { WebSocketServer, WebSocket } from "ws";
import { logger } from "@interview-ai/logger";
import type { WebSocketEnvelope } from "@interview-ai/types";

const rtLogger = logger.with({ component: "RealtimeGateway" });
const PORT = process.env.REALTIME_PORT ? parseInt(process.env.REALTIME_PORT) : 8002;

export function bootstrapRealtimeGateway() {
  const wss = new WebSocketServer({ port: PORT });
  rtLogger.info(`Realtime WebSocket Gateway listening on port ${PORT}`);

  wss.on("connection", (ws: WebSocket, req) => {
    rtLogger.info(`New client connected from ${req.socket.remoteAddress}`);

    ws.on("message", (data: string) => {
      try {
        const envelope: WebSocketEnvelope = JSON.parse(data.toString());
        if (envelope.type === "PING") {
          ws.send(
            JSON.stringify({
              type: "PONG",
              timestamp: new Date().toISOString(),
              payload: { sequence: envelope.sequence },
            })
          );
        }
      } catch (err) {
        rtLogger.warn("Malformed packet received", err);
      }
    });

    ws.on("close", () => {
      rtLogger.info("Client disconnected");
    });
  });

  return wss;
}

if (require.main === module) {
  bootstrapRealtimeGateway();
}
