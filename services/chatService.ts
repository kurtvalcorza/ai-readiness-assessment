/**
 * Chat Service
 * Handles message validation, prompt injection detection, and message preparation for AI
 */

import { validateMessageContent, detectPromptInjection } from '@/lib/validation';
import { MAX_MESSAGE_LENGTH, MAX_MESSAGES_COUNT, BLOCK_PROMPT_INJECTION } from '@/lib/constants';
import { CoreMessage, IncomingMessage } from '@/lib/types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a single message for length and content
 * @param content - The message content to validate
 * @returns Validation result
 */
export function validateMessage(content: string): ValidationResult {
  // Check message length
  if (content.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  // Validate content (spam detection)
  try {
    validateMessageContent(content);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid input detected',
    };
  }
}

/**
 * Validates the conversation message count
 * @param messages - Array of messages
 * @returns Validation result
 */
export function validateConversation(messages: any[]): ValidationResult {
  if (!messages || !Array.isArray(messages)) {
    return {
      valid: false,
      error: 'Invalid request: messages array is required',
    };
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return {
      valid: false,
      error: 'Too many messages in conversation. Please start a new assessment.',
    };
  }

  return { valid: true };
}

/**
 * Detects potential prompt injection attempts in user messages
 * @param content - The message content to check
 * @returns Validation result with detected patterns
 */
export function detectPromptInjectionAttempt(content: string): ValidationResult {
  const injectionPatterns = detectPromptInjection(content);

  if (injectionPatterns.length > 0) {
    console.warn('Potential prompt injection detected:', injectionPatterns);

    if (BLOCK_PROMPT_INJECTION) {
      return {
        valid: false,
        error:
          'Your message contains patterns that may indicate a security risk. ' +
          'Please rephrase your response and avoid using system commands or unusual formatting.',
      };
    }
  }

  return { valid: true };
}

/**
 * Prepares messages for AI by converting to CoreMessage format and validating
 * @param messages - Array of incoming messages
 * @returns Array of CoreMessage objects ready for AI
 * @throws Error if validation fails
 */
export function prepareMessagesForAI(messages: IncomingMessage[]): CoreMessage[] {
  return messages.map((m: IncomingMessage) => {
    let content = '';

    // Handle both parts format and content format
    if (m.parts) {
      content = m.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
    } else if (typeof m.content === 'string') {
      content = m.content;
    }

    // Validate user messages
    if (m.role === 'user') {
      // Validate message length and content
      const messageValidation = validateMessage(content);
      if (!messageValidation.valid) {
        throw new Error(messageValidation.error);
      }

      // Check for prompt injection
      const injectionValidation = detectPromptInjectionAttempt(content);
      if (!injectionValidation.valid) {
        throw new Error(injectionValidation.error);
      }
    }

    return {
      role: m.role,
      content,
    };
  });
}
