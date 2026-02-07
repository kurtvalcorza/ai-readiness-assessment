/**
 * Security-related constants
 * Rate limiting and prompt injection detection
 */

/**
 * Security configuration namespace
 */
export const SECURITY = {
  /**
   * Chat API rate limiting
   * Limits: 30 requests per minute
   */
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 30, // 30 requests per minute
  },

  /**
   * Submission API rate limiting
   * Limits: 5 submissions per 5 minutes
   */
  SUBMISSION_RATE_LIMIT: {
    WINDOW_MS: 300000, // 5 minutes
    MAX_REQUESTS: 5, // 5 submissions per 5 minutes
  },

  /**
   * Prompt injection detection
   */
  PROMPT_INJECTION: {
    ENABLED: true, // Block requests with detected prompt injection attempts
    PATTERNS: [
      /ignore\s+(previous|all|prior)\s+instructions?/i,
      /disregard\s+(previous|all|prior)\s+instructions?/i,
      /forget\s+(previous|all|prior)\s+instructions?/i,
      /system\s*:\s*you\s+are/i,
      /<\s*script\s*>/i,
      /\{\{.*?\}\}/i, // Template injection
      /\$\{.*?\}/i, // String interpolation
    ] as const,
  },
} as const;

// Legacy exports for backward compatibility
export const RATE_LIMIT_WINDOW = SECURITY.RATE_LIMIT.WINDOW_MS;
export const MAX_REQUESTS_PER_WINDOW = SECURITY.RATE_LIMIT.MAX_REQUESTS;
export const SUBMISSION_RATE_LIMIT_WINDOW = SECURITY.SUBMISSION_RATE_LIMIT.WINDOW_MS;
export const MAX_SUBMISSIONS_PER_WINDOW = SECURITY.SUBMISSION_RATE_LIMIT.MAX_REQUESTS;
export const BLOCK_PROMPT_INJECTION = SECURITY.PROMPT_INJECTION.ENABLED;
export const PROMPT_INJECTION_PATTERNS = SECURITY.PROMPT_INJECTION.PATTERNS;
