/**
 * Chat API route handler
 * Handles AI chat requests with rate limiting, validation, and security checks
 */

import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { systemPrompt } from '@/lib/systemPrompt';
import { validateEnv } from '@/lib/env';
import { checkChatRateLimit } from '@/lib/rate-limit';
import { validateMessageContent, detectPromptInjection } from '@/lib/validation';
import { MAX_MESSAGE_LENGTH, MAX_MESSAGES_COUNT, BLOCK_PROMPT_INJECTION } from '@/lib/constants';
import { CoreMessage, IncomingMessage } from '@/lib/types';

export const maxDuration = 30;

/**
 * POST handler for chat requests
 * @param req - The incoming request
 * @returns Streamed chat response or error
 */
export async function POST(req: Request) {
  try {
    // Rate limiting check
    const rateLimit = await checkChatRateLimit(req);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please wait a moment before trying again.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Validate environment variables
    validateEnv();
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate message count
    if (messages.length > MAX_MESSAGES_COUNT) {
      return new Response(
        JSON.stringify({
          error: 'Too many messages in conversation. Please start a new assessment.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert to CoreMessage format and validate content
    const coreMessages: CoreMessage[] = messages.map((m: IncomingMessage) => {
      let content = '';
      if (m.parts) {
        content = m.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('');
      } else if (typeof m.content === 'string') {
        content = m.content;
      }

      // Validate message length
      if (content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
      }

      // Validate content and check for malicious patterns
      if (m.role === 'user') {
        // Validate message content (spam detection)
        validateMessageContent(content);

        // Check for potential prompt injection attempts
        const injectionPatterns = detectPromptInjection(content);
        if (injectionPatterns.length > 0) {
          console.warn('Potential prompt injection detected:', injectionPatterns);

          if (BLOCK_PROMPT_INJECTION) {
            throw new Error(
              'Your message contains patterns that may indicate a security risk. ' +
                'Please rephrase your response and avoid using system commands or unusual formatting.'
            );
          }
        }
      }

      return {
        role: m.role,
        content,
      };
    });

    const result = streamText({
      model: google('models/gemini-2.5-flash'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);

    // Determine safe client-facing message based on known validation errors
    const safeMessages = [
      'Message exceeds maximum length',
      'Your message contains patterns that may indicate a security risk',
      'Invalid input detected',
    ];
    const clientMessage = safeMessages.find((msg) => error.message?.includes(msg))
      ? error.message
      : 'An internal error occurred. Please try again.';

    return new Response(
      JSON.stringify({ error: clientMessage }),
      { 
        status: error.message?.includes('maximum length') || error.message?.includes('Invalid input') ? 400 : 500, 
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        } 
      }
    );
  }
}
