import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { systemPrompt } from '@/lib/systemPrompt';
import { validateEnv } from '@/lib/env';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
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

        // Convert to CoreMessage format
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
