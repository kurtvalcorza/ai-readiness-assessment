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

export async function POST(req: Request) {
    try {
        const data: AssessmentData = await req.json();

        // Validate required fields
        if (!data.organization || !data.domain || !data.readinessLevel) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
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
