import { z } from "zod";

/**
 * Email validation schema
 * Normalized to lowercase and trimmed
 */
const emailSchema = z
  .string()
  .email("Nieprawidłowy format adresu email")
  .max(255, "Email nie może mieć więcej niż 255 znaków")
  .trim()
  .toLowerCase();

/**
 * Password validation schema
 * Minimum 8 characters, maximum 256
 */
const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(256, "Hasło nie może przekraczać 256 znaków");

/**
 * Validation schema for POST /auth/signup
 */
export const authSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Validation schema for POST /auth/login
 */
export const authLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Validation schema for POST /auth/reset-password
 */
export const authResetPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Validation schema for Authorization header
 */
export const authorizationHeaderSchema = z
  .string()
  .regex(/^Bearer\s.+/, "Authorization header must be in format: Bearer <token>");

/**
 * Type exports for use in API routes and services
 */
export type AuthSignupInput = z.infer<typeof authSignupSchema>;
export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthResetPasswordInput = z.infer<typeof authResetPasswordSchema>;
