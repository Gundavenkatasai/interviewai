import { z } from "zod";

export const ClientEventSchema = z.object({
  eventId: z.string().optional(),
  type: z.string().min(1),
  sessionId: z.string().optional(),
  interviewId: z.string().optional(),
  sequence: z.number().optional(),
  stateVersion: z.number().optional(),
  questionId: z.string().optional(),
  timestamp: z.string().optional(),
  payload: z.any().optional(),
});

export type ClientEvent = z.infer<typeof ClientEventSchema>;

export interface ServerEvent {
  type: string;
  sessionId: string;
  sequence: number;
  stateVersion: number;
  questionId?: string;
  timestamp: string;
  correlationId?: string;
  payload?: any;
}
