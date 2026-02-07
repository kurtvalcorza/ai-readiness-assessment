/**
 * Validation-related constants
 * Message validation, PII patterns, and content limits
 */

/**
 * Validation configuration namespace
 */
export const VALIDATION = {
  /**
   * Message validation limits
   */
  MESSAGE: {
    MAX_LENGTH: 2000, // Maximum characters per message
    MIN_UNIQUE_CHARS: 5, // Minimum unique characters for spam detection
    MIN_LENGTH_FOR_SPAM_CHECK: 100, // Minimum message length to trigger spam check
  },

  /**
   * Conversation limits
   */
  CONVERSATION: {
    MAX_MESSAGES: 50, // Max messages in conversation
    MAX_HISTORY_SIZE: 50000, // Maximum size for conversation history in bytes
  },

  /**
   * Field length limits
   */
  ORGANIZATION: {
    MAX_LENGTH: 500, // Max length for organization field
  },

  DOMAIN: {
    MAX_LENGTH: 500, // Max length for domain field
  },

  /**
   * PII detection patterns
   * Used for sanitizing sensitive information
   */
  PII_PATTERNS: {
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
  } as const,

  /**
   * PII redaction placeholders
   */
  REDACTION: {
    EMAIL: '[EMAIL_REDACTED]',
    PHONE: '[PHONE_REDACTED]',
    SSN: '[SSN_REDACTED]',
    TRUNCATED: '...[truncated]',
  } as const,
} as const;

// Legacy exports for backward compatibility
export const MAX_INPUT_LENGTH = VALIDATION.MESSAGE.MAX_LENGTH;
export const MAX_MESSAGE_LENGTH = VALIDATION.MESSAGE.MAX_LENGTH;
export const MIN_UNIQUE_CHARS = VALIDATION.MESSAGE.MIN_UNIQUE_CHARS;
export const MIN_LENGTH_FOR_SPAM_CHECK = VALIDATION.MESSAGE.MIN_LENGTH_FOR_SPAM_CHECK;
export const MAX_MESSAGES_COUNT = VALIDATION.CONVERSATION.MAX_MESSAGES;
export const MAX_CONVERSATION_HISTORY_SIZE = VALIDATION.CONVERSATION.MAX_HISTORY_SIZE;
export const MAX_ORGANIZATION_LENGTH = VALIDATION.ORGANIZATION.MAX_LENGTH;
export const MAX_DOMAIN_LENGTH = VALIDATION.DOMAIN.MAX_LENGTH;
export const PII_PATTERNS = VALIDATION.PII_PATTERNS;
export const REDACTION_PLACEHOLDERS = VALIDATION.REDACTION;
