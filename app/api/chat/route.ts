import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { systemPrompt } from '@/lib/systemPrompt';
import { validateEnv } from '@/lib/env';

export const maxDuration = 30;

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const MAX_MESSAGE_LENGTH = 2000; // Max characters per message
const MAX_MESSAGES_COUNT = 50; // Max messages in conversation

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 300000);

function getRateLimitKey(req: Request): string {
    // Use IP address or session identifier for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
}

function checkRateLimit(req: Request): { allowed: boolean; remaining: number } {
    const key = getRateLimitKey(req);
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
        requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

export async function POST(req: Request) {
    try {
        // Rate limiting check
        const rateLimit = checkRateLimit(req);
        if (!rateLimit.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Too many requests. Please wait a moment before trying again.'
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '60'
                    }
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
                JSON.stringify({ error: 'Too many messages in conversation. Please start a new assessment.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Convert to CoreMessage format and validate content
        const coreMessages = messages.map((m: any) => {
            let content = '';
            if (m.parts) {
                content = m.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('');
            } else if (typeof m.content === 'string') {
                content = m.content;
            }

            // Validate message length
            if (content.length > MAX_MESSAGE_LENGTH) {
                throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
            }

            // Basic content validation - prevent malicious patterns
            if (m.role === 'user') {
                // Check for extremely repetitive content (potential attack)
                const uniqueChars = new Set(content.toLowerCase().replace(/\s/g, '')).size;
                if (uniqueChars < 5 && content.length > 100) {
                    throw new Error('Invalid message content detected');
                }

                // Check for potential prompt injection attempts
                const suspiciousPatterns = [
                    /ignore\s+(previous|all)\s+instructions?/i,
                    /disregard\s+(previous|all)\s+instructions?/i,
                    /forget\s+(previous|all)\s+instructions?/i,
                    /system\s*:\s*you\s+are/i,
                    /<\s*script\s*>/i,
                ];

                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(content)) {
                        console.warn('Potential prompt injection attempt detected');
                        // Don't block entirely, just log - false positives are possible
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

        return new Response(
            JSON.stringify({ error: error.message || 'An internal error occurred.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
