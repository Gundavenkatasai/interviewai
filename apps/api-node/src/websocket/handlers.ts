import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { WebSocketManager } from "./manager";
import { ClientEventSchema } from "./types";
import { InterviewSession, InterviewQuestion } from "../modules/interview/interview.model";

// Simple in-memory LRU for deduplicating client event IDs
const processedEvents = new Set<string>();
function isDuplicate(eventId: string): boolean {
  if (processedEvents.has(eventId)) return true;
  processedEvents.add(eventId);
  // Keep set size manageable
  if (processedEvents.size > 10000) {
    const iterator = processedEvents.values();
    for (let i = 0; i < 1000; i++) {
      const val = iterator.next().value;
      if (val) processedEvents.delete(val);
    }
  }
  return false;
}

export async function websocketRoutes(app: FastifyInstance) {
  app.get("/ws/interview/:sessionId", { websocket: true }, async (connection: WebSocket, req: FastifyRequest<{ Params: { sessionId: string } }>) => {
    const { sessionId } = req.params;
    
    try {
      // Decode JWT token to verify authentication
      const token = (req.query as any)?.token || req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        console.error("WS Auth Failed: No token provided", { query: req.query, headers: req.headers });
        connection.close(1008, "Unauthorized: No token provided");
        return;
      }
      
      const decoded = app.jwt.verify(token);
      if (!decoded) {
        console.error("WS Auth Failed: Invalid token", token);
        connection.close(1008, "Unauthorized: Invalid token");
        return;
      }
      
      // Additional check: Does the user own this session?
      const session = await InterviewSession.findOne({ _id: sessionId, userId: (decoded as any).sub });
      if (!session) {
        console.error("WS Auth Failed: Session not found or owned by user", { sessionId, userId: (decoded as any).sub });
        connection.close(1008, "Unauthorized: Session not found or owned by user");
        return;
      }

      console.log("WS Auth Success: Connected session", sessionId);

      WebSocketManager.addConnection(sessionId, connection);

      connection.on("message", async (message: string) => {
        try {
          const rawData = JSON.parse(message);
          
          // Zod Validation
          const parsed = ClientEventSchema.safeParse(rawData);
          if (!parsed.success) {
            WebSocketManager.sendToSession(sessionId, "ERROR", { 
              code: "INVALID_EVENT", 
              message: "Event does not match expected schema",
              errors: parsed.error.issues
            });
            return;
          }

          const clientEvent = parsed.data;

          // Deduplication
          if (isDuplicate(clientEvent.eventId)) {
            // Drop duplicate
            return;
          }

          // In standard Fastify hooks context isn't preserved here, so we pass dependencies directly
          await handleMessage(sessionId, clientEvent, session.userId);
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      });
    } catch (error) {
      console.error("WS Auth Exception:", error);
      connection.close(1008, "Unauthorized: Token verification failed");
    }
  });
}

async function handleMessage(sessionId: string, clientEvent: any, userId: string) {
  const { type, payload, eventId } = clientEvent;
  
  switch (type) {
    case "STATE_SYNC_REQUEST":
      await handleStateSync(sessionId, userId, eventId);
      break;

    case "AI_SPEAKING_STARTED":
      await updateStateIfValid(sessionId, ["setup", "SETUP", "ready", "READY", "CANDIDATE_READY", "CREATED", "GENERATING_NEXT"], "speaking", "AI_SPEAKING", eventId);
      break;

    case "CANDIDATE_READY":
      // Valid transition from SETUP/AI_SPEAKING/EVALUATING/GENERATING_NEXT to CANDIDATE_READY
      await updateStateIfValid(sessionId, ["setup", "SETUP", "AI_SPEAKING", "CREATED", "EVALUATING", "GENERATING_NEXT"], "ready", "CANDIDATE_READY", eventId);
      break;
      
    case "CANDIDATE_SPEAKING_STARTED":
      await updateStateIfValid(sessionId, ["ready", "READY", "CANDIDATE_READY"], "speaking", "CANDIDATE_SPEAKING", eventId);
      break;

    case "TRANSCRIPT_PARTIAL":
      // Optional: Broadcast back to other potential viewers, but normally just ignored or logged
      break;

    case "TRANSCRIPT_FINAL":
      // Save transcript chunk directly to DB if needed
      break;

    case "PING":
      // Answered automatically by ws module 'pong' or explicitly here
      break;

    default:
      console.warn("Unknown websocket event type:", type);
  }
}

async function handleStateSync(sessionId: string, userId: string, correlationId: string) {
  try {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return;

    const questions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    const currentQuestion = questions[session.currentQuestionIndex || 0];

    const syncPayload = {
      state: session.state, // the detailed frontend state
      status: session.status, // the high level backend state
      stateVersion: session.stateVersion,
      currentQuestionIndex: session.currentQuestionIndex,
      currentQuestion: currentQuestion ? {
        id: currentQuestion._id,
        _id: currentQuestion._id,
        question_id: currentQuestion._id,
        question_text: currentQuestion.questionText,
        questionText: currentQuestion.questionText,
      } : null,
      totalQuestions: questions.length,
      elapsedSeconds: session.elapsedSeconds,
      score: session.score,
    };

    await WebSocketManager.sendToSession(sessionId, "STATE_SYNC_RESPONSE", syncPayload, correlationId);
  } catch (error) {
    console.error("State sync failed", error);
  }
}

async function updateStateIfValid(
  sessionId: string, 
  allowedCurrentStates: string[], 
  newStatus: string, 
  newState: string,
  correlationId: string
) {
  // Use optimistic locking or simple findOneAndUpdate with state check
  const session = await InterviewSession.findOneAndUpdate(
    { 
      _id: sessionId, 
      $or: [
        ...allowedCurrentStates.map(s => ({ state: s })),
        ...allowedCurrentStates.map(s => ({ status: s }))
      ]
    },
    { 
      $set: { status: newStatus, state: newState },
      $inc: { stateVersion: 1 }
    },
    { new: true }
  );

  if (session) {
    WebSocketManager.sendToSession(sessionId, "INTERVIEW_STATE", { 
      state: session.state, 
      status: session.status,
      stateVersion: session.stateVersion
    }, correlationId);
  }
}
