import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  full_name: z.string().optional(),
  termsAccepted: z.boolean().optional(),
  termsVersion: z.string().optional(),
}).transform((data) => ({
  email: data.email,
  password: data.password,
  fullName: data.fullName || data.full_name || "User",
  termsAccepted: data.termsAccepted ?? true,
  termsVersion: data.termsVersion || "v2.0",
}));

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
