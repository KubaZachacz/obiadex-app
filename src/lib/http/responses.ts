import type { ZodError } from "zod";

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Creates a JSON response with the given status and data
 */
function jsonResponse(data: unknown, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Returns a 400 Bad Request response for validation errors
 */
export function respondValidationError(zodError: ZodError): Response {
  return jsonResponse(
    {
      error: "Walidacja nie powiodła się",
      details: zodError.issues,
    } satisfies ErrorResponse,
    400
  );
}

/**
 * Returns a 422 Unprocessable Entity response for domain validation errors
 */
export function respondUnprocessableEntity(message: string): Response {
  return jsonResponse(
    {
      error: message,
    } satisfies ErrorResponse,
    422
  );
}

/**
 * Returns a 401 Unauthorized response
 */
export function respondUnauthorized(message = "Brak dostępu"): Response {
  return jsonResponse(
    {
      error: message,
    } satisfies ErrorResponse,
    401
  );
}

/**
 * Returns a 404 Not Found response
 */
export function respondNotFound(message = "Nie znaleziono zasobu"): Response {
  return jsonResponse(
    {
      error: message,
    } satisfies ErrorResponse,
    404
  );
}

/**
 * Returns a 409 Conflict response for duplicate resources
 */
export function respondConflict(message: string): Response {
  return jsonResponse(
    {
      error: message,
    } satisfies ErrorResponse,
    409
  );
}

/**
 * Returns a 500 Internal Server Error response
 */
export function respondInternalError(message = "Wewnętrzny błąd serwera"): Response {
  return jsonResponse(
    {
      error: message,
    } satisfies ErrorResponse,
    500
  );
}

/**
 * Maps database errors to appropriate HTTP responses
 */
export function respondDbError(error: { code?: string; message: string }): Response {
  // PostgreSQL error code 23505: unique_violation
  if (error.code === "23505") {
    return respondConflict("Zasób już istnieje");
  }

  // PostgreSQL error code PGRST116: no rows returned (from .single())
  if (error.message?.includes("PGRST116") || error.message?.includes("no rows")) {
    return respondNotFound();
  }

  // Default to internal server error
  console.error("Database error:", error);
  return respondInternalError();
}

/**
 * Returns a 200 OK response with JSON data
 */
export function respondOk(data: unknown, headers?: HeadersInit): Response {
  return jsonResponse(data, 200, headers);
}

/**
 * Returns a 201 Created response with JSON data
 */
export function respondCreated(data: unknown, headers?: HeadersInit): Response {
  return jsonResponse(data, 201, headers);
}

/**
 * Returns a 204 No Content response
 */
export function respondNoContent(): Response {
  return new Response(null, { status: 204 });
}
