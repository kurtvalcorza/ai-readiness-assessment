export const maxDuration = 30;

interface AssessmentData {
    organization: string;
    domain: string;
    readinessLevel: string;
    solutions: Array<{
        priority: string;
        group: string;
        category: string;
        fit: string;
        rationale: string;
    }>;
    nextSteps: string[];
    timestamp: string;
    conversationHistory?: string;
}

// Simple in-memory rate limiting for submissions
const submissionCounts = new Map<string, { count: number; resetTime: number }>();
const SUBMISSION_RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 5; // 5 submissions per 5 minutes

// Clean up old entries
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of submissionCounts.entries()) {
        if (now > value.resetTime) {
            submissionCounts.delete(key);
        }
    }
}, 300000);

function getSubmissionRateLimitKey(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
}

function checkSubmissionRateLimit(req: Request): boolean {
    const key = getSubmissionRateLimitKey(req);
    const now = Date.now();
    const record = submissionCounts.get(key);

    if (!record || now > record.resetTime) {
        submissionCounts.set(key, { count: 1, resetTime: now + SUBMISSION_RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= MAX_SUBMISSIONS_PER_WINDOW) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(req: Request) {
    try {
        // Rate limiting check
        if (!checkSubmissionRateLimit(req)) {
            return new Response(
                JSON.stringify({
                    error: 'Too many submissions. Please wait a few minutes before submitting again.'
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '300'
                    }
                }
            );
        }

        const data: AssessmentData = await req.json();

        // Validate required fields
        if (!data.organization || !data.domain || !data.readinessLevel) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validate data sizes to prevent abuse
        if (data.organization.length > 500 || data.domain.length > 500) {
            return new Response(
                JSON.stringify({ error: 'Field values exceed maximum length' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get Google Sheets webhook URL from environment
        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('Google Sheets webhook URL not configured');
            // Don't fail - just skip submission
            return new Response(
                JSON.stringify({ success: true, message: 'Data received (webhook not configured)' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Format data for Google Sheets
        const formattedData = {
            timestamp: data.timestamp,
            organization: data.organization,
            domain: data.domain,
            readinessLevel: data.readinessLevel,
            primarySolution: data.solutions[0]?.category || '',
            secondarySolution: data.solutions[1]?.category || '',
            nextSteps: data.nextSteps.join('; '),
            conversationHistory: data.conversationHistory || ''
        };

        // Submit to Google Sheets via webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData)
        });

        if (!response.ok) {
            throw new Error(`Google Sheets submission failed: ${response.statusText}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Assessment submitted successfully' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Submit API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Submission failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
