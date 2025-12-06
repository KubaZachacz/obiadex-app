import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/signup",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/reset-password",
  // Auth callback
  "/auth/callback",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store in locals for use in API routes and pages
  locals.supabase = supabase;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "",
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
