/**
 * API utility functions for consistent response handling
 * Provides standardized response formatting and error handling across all API routes
 */

/**
 * Response options for customizing API responses
 */
export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Error response options with additional error handling features
 */
export interface ErrorOptions extends ResponseOptions {
  code?: string;
  logError?: boolean;
}

/**
 * Get security headers to apply to all API responses
 * Prevents common security vulnerabilities
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

/**
 * Create a standardized JSON response with security headers
 * @param data - The data to return in the response
 * @param options - Optional status code and additional headers
 * @returns Response object with JSON data and security headers
 */
export function createJsonResponse<T>(
  data: T,
  options: ResponseOptions = {}
): Response {
  const { status = 200, headers = {} } = options;

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
      ...headers,
    },
  });
}

/**
 * Create a standardized error response with security headers
 * Sanitizes error messages and logs internal errors
 * @param error - Error object or error message string
 * @param options - Optional status code, error code, and logging flag
 * @returns Response object with error message and security headers
 */
export function createErrorResponse(
  error: Error | string,
  options: ErrorOptions = {}
): Response {
  const { status = 500, code, logError = true, headers = {} } = options;

  // Extract error message
  const message = typeof error === 'string' ? error : error.message;

  // Log internal errors (but don't expose details to client)
  if (logError && typeof error !== 'string') {
    console.error('API error:', error);
  }

  // Sanitize error message for client
  const clientMessage = status >= 500 ? 'Internal server error' : message;

  return new Response(
    JSON.stringify({
      error: clientMessage,
      ...(code && { code }),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
        ...headers,
      },
    }
  );
}
