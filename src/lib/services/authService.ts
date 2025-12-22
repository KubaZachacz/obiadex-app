import type { SupabaseClient } from "@/db/supabase.client";
import type { AuthSignupCommand, AuthSignupResponse, AuthLoginCommand, AuthLoginResponse } from "@/types";

/**
 * Signs up a new user using Supabase Auth
 */
export async function signup(supabase: SupabaseClient, command: AuthSignupCommand): Promise<AuthSignupResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: command.email,
    password: command.password,
  });

  if (error) {
    // Check for duplicate email
    if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
      const duplicateError = new Error("Email already exists") as Error & { code: string; status: number };
      duplicateError.code = "DUPLICATE_EMAIL";
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }

  if (!data.user || !data.user.email) {
    throw new Error("Failed to create user");
  }

  return {
    userId: data.user.id,
    email: data.user.email,
  };
}

/**
 * Logs in a user using Supabase Auth
 */
export async function login(supabase: SupabaseClient, command: AuthLoginCommand): Promise<AuthLoginResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: command.email,
    password: command.password,
  });

  if (error) {
    // Check for invalid credentials
    if (error.message?.includes("Invalid") || error.message?.includes("credentials")) {
      const authError = new Error("Nieprawidłowy login lub hasło") as Error & {
        code: string;
        status: number;
      };
      authError.code = "INVALID_CREDENTIALS";
      authError.status = 401;
      throw authError;
    }
    throw error;
  }

  if (!data.session) {
    throw new Error("Failed to create session");
  }

  return {
    accessToken: data.session.access_token,
    expiresInSec: data.session.expires_in ?? 3600,
  };
}

/**
 * Logs out the current user
 */
export async function logout(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Sends a password reset email
 * Note: Always returns success to prevent email enumeration
 */
export async function resetPassword(supabase: SupabaseClient, email: string, redirectUrl?: string): Promise<void> {
  // Always return success to prevent email enumeration
  // Supabase will only send email if the user exists
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  // Log error but don't throw to prevent enumeration
  if (error) {
    console.error("Password reset error (not throwing to prevent enumeration):", error);
  }
}
