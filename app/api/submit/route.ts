/**
 * Submit API route handler
 * Handles assessment submission to Google Sheets with rate limiting and validation
 */

import { checkSubmissionRateLimit } from '@/lib/rate-limit';
import { validateAssessmentData } from '@/lib/validation';
import { signWebhookPayload } from '@/lib/webhook-signing';
import { MAX_ORGANIZATION_LENGTH, MAX_DOMAIN_LENGTH } from '@/lib/constants';
import { AssessmentData, GoogleSheetsData, APISuccess, APIError } from '@/lib/types';

export const maxDuration = 30;

/**
 * POST handler for assessment submissions
 * @param req - The incoming request
 * @returns Success or error response
 */
export async function POST(req: Request): Promise<Response> {
  try {
    // Rate limiting check
    const rateLimit = await checkSubmissionRateLimit(req);
    if (!rateLimit.allowed) {
      const error: APIError = {
        error: 'Too many submissions. Please wait a few minutes before submitting again.',
      };
      return new Response(JSON.stringify(error), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '300',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    }

    const data: AssessmentData = await req.json();

    // Validate data structure
    validateAssessmentData(data);

    // Validate data sizes to prevent abuse
    if (
      data.organization.length > MAX_ORGANIZATION_LENGTH ||
      data.domain.length > MAX_DOMAIN_LENGTH
    ) {
      const error: APIError = { error: 'Field values exceed maximum length' };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    }

    // Get Google Sheets webhook URL from environment
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('Google Sheets webhook URL not configured');
      // Don't fail - just skip submission
      const success: APISuccess = {
        success: true,
        message: 'Data received (webhook not configured)',
      };
      return new Response(JSON.stringify(success), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      });
    }

    // Format data for Google Sheets
    const formattedData: GoogleSheetsData = {
      timestamp: data.timestamp,
      organization: data.organization,
      domain: data.domain,
      readinessLevel: data.readinessLevel,
      primarySolution: data.solutions[0]?.category || '',
      secondarySolution: data.solutions[1]?.category || '',
      nextSteps: data.nextSteps.join('; '),
      conversationHistory: data.conversationHistory || '',
    };

    // Submit to Google Sheets via webhook
    const signingSecret = process.env.WEBHOOK_SIGNING_SECRET;
    let body: string;

    if (signingSecret) {
      body = signWebhookPayload(formattedData, signingSecret);
    } else {
      body = JSON.stringify(formattedData);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Google Sheets submission failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Google Sheets script error: ${result.error || 'Unknown error'}`);
    }

    const success: APISuccess = {
      success: true,
      message: 'Assessment submitted successfully',
    };
    return new Response(JSON.stringify(success), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  } catch (error: any) {
    console.error('Submit API error:', error);

    // Only surface known validation errors to the client
    const safeMessages = [
      'Invalid organization field',
      'Invalid domain field',
      'Invalid readinessLevel field',
      'Solutions must be an array',
      'Next steps must be an array',
      'Invalid solution structure',
      'Field values exceed maximum length',
      'Google Sheets script error',
    ];
    const clientMessage = safeMessages.find((msg) => error.message?.includes(msg))
      ? error.message
      : 'Submission failed. Please try again.';

    const apiError: APIError = { error: clientMessage };
    return new Response(JSON.stringify(apiError), {
      status: safeMessages.some((msg) => error.message?.includes(msg)) ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  }
}
