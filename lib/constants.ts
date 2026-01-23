/**
 * Application-wide constants
 */

// Security limits
export const MAX_INPUT_LENGTH = 2000; // Maximum characters per message
export const MAX_CONVERSATION_HISTORY_SIZE = 50000; // Maximum size for conversation history in bytes
export const MAX_MESSAGES_COUNT = 50; // Max messages in conversation
export const MAX_MESSAGE_LENGTH = 2000; // Max characters per message
export const MAX_ORGANIZATION_LENGTH = 500; // Max length for organization field
export const MAX_DOMAIN_LENGTH = 500; // Max length for domain field

// Rate limiting
export const RATE_LIMIT_WINDOW = 60000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
export const SUBMISSION_RATE_LIMIT_WINDOW = 300000; // 5 minutes
export const MAX_SUBMISSIONS_PER_WINDOW = 5; // 5 submissions per 5 minutes

// Content validation
export const MIN_UNIQUE_CHARS = 5; // Minimum unique characters for spam detection
export const MIN_LENGTH_FOR_SPAM_CHECK = 100; // Minimum message length to trigger spam check
export const BLOCK_PROMPT_INJECTION = true; // Block requests with detected prompt injection attempts

/**
 * Regex patterns for PII detection and sanitization
 * Extracted for maintainability and testing
 */
export const PII_PATTERNS = {
  /**
   * Matches email addresses
   * Example: user@example.com, name+tag@domain.co.uk
   */
  EMAIL: /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g,

  /**
   * Matches phone numbers in various formats
   * Examples: 123-456-7890, (123) 456-7890, 123.456.7890, +1-123-456-7890
   */
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,

  /**
   * Matches Social Security Numbers
   * Example: 123-45-6789
   */
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
} as const;

/**
 * Suspicious patterns that may indicate prompt injection attempts
 */
export const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+instructions?/i,
  /disregard\s+(previous|all|prior)\s+instructions?/i,
  /forget\s+(previous|all|prior)\s+instructions?/i,
  /system\s*:\s*you\s+are/i,
  /<\s*script\s*>/i,
  /\{\{.*?\}\}/i, // Template injection
  /\$\{.*?\}/i, // String interpolation
] as const;

/**
 * Regex pattern for parsing assessment report solutions
 * Matches format: #### Priority - Category
 */
export const SOLUTION_PATTERN =
  /####\s+(\w+)\s+-\s+([^\n]+)\n\*\*Group:\*\*\s+([^\n]+)\n\*\*Fit:\*\*\s+([^\n]+)\n\*\*Rationale:\*\*\s+([\s\S]+?)(?=\n####|\n###|\n---|\n\*\*Thank you|$)/g;

/**
 * Regex pattern for parsing next steps from the report
 * Matches numbered list items
 */
export const NEXT_STEPS_PATTERN = /\*\*Recommended Next Steps:\*\*\s*\n((?:\d+\.\s+.+\n?)+)/;

/**
 * Marker indicating assessment completion
 */
export const ASSESSMENT_COMPLETE_MARKER = '###ASSESSMENT_COMPLETE###';

/**
 * PII redaction placeholders
 */
export const REDACTION_PLACEHOLDERS = {
  EMAIL: '[EMAIL_REDACTED]',
  PHONE: '[PHONE_REDACTED]',
  SSN: '[SSN_REDACTED]',
  TRUNCATED: '...[truncated]',
} as const;
