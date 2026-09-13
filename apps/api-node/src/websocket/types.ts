import { z } from "zod";

export const ClientEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.string().min(1),
  interviewId: z.string().min(1),
  timestamp: z.string().datetime(),
  payload: z.any().optional(),
});

export type ClientEvent = z.infer<typeof ClientEventSchema>;

export interface ServerEvent {
  sequence: number;
  type: string;
  timestamp: string;
  correlationId?: string;
  payload?: any;
}
