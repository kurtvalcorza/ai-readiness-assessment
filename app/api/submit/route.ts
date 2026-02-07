/**
 * Submit API route handler
 * Handles assessment submission to Google Sheets with rate limiting and validation
 */

import { checkSubmissionRateLimit } from '@/lib/rate-limit';
import { validateAssessmentData } from '@/lib/validation';
import { createJsonResponse, createErrorResponse } from '@/lib/api-utils';
import { submitAssessment } from '@/services/submissionService';
import { MAX_ORGANIZATION_LENGTH, MAX_DOMAIN_LENGTH } from '@/lib/constants';
import { AssessmentData } from '@/lib/types';

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
      return createErrorResponse(
        'Too many submissions. Please wait a few minutes before submitting again.',
        429,
        { headers: { 'Retry-After': '300' } }
      );
    }

    const data: AssessmentData = await req.json();

    console.log('[submit] Received data keys:', Object.keys(data));
    console.log('[submit] Organization:', data.organization?.substring(0, 50));
    console.log('[submit] Solutions count:', data.solutions?.length);
    console.log('[submit] NextSteps count:', data.nextSteps?.length);
    console.log('[submit] Webhook URL configured:', !!process.env.GOOGLE_SHEETS_WEBHOOK_URL);
    console.log('[submit] Webhook URL length:', process.env.GOOGLE_SHEETS_WEBHOOK_URL?.length ?? 0);

    // Validate data structure
    try {
      validateAssessmentData(data);
      console.log('[submit] Validation passed');
    } catch (validationError: any) {
      console.error('[submit] Validation failed:', validationError.message);
      throw validationError;
    }

    // Validate data sizes to prevent abuse
    if (
      data.organization.length > MAX_ORGANIZATION_LENGTH ||
      data.domain.length > MAX_DOMAIN_LENGTH
    ) {
      return createErrorResponse('Field values exceed maximum length', 400);
    }

    // Submit to Google Sheets
    console.log('[submit] Submitting to Google Sheets...');
    const result = await submitAssessment(data, {
      webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
      signingSecret: process.env.WEBHOOK_SIGNING_SECRET,
    });
    console.log('[submit] Submission result:', JSON.stringify(result));

    if (!result.success) {
      // Check if it's a Google Sheets script error (should be surfaced to client)
      if (result.error?.includes('Google Sheets script error')) {
        return createErrorResponse(result.error, 400);
      }
      // All other errors are internal (network, etc.) - use custom message without sanitization
      return createErrorResponse('Submission failed. Please try again.', 500, { sanitize: false });
    }

    return createJsonResponse({ success: true, message: result.message }, { status: 200 });
  } catch (error: any) {
    console.error('[submit] Unhandled error:', error.message);
    console.error('[submit] Error stack:', error.stack);

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
      'Validation failed:', // Zod validation errors
      'Invalid assessment data structure', // Zod validation fallback
    ];
    const clientMessage = safeMessages.find((msg) => error.message?.includes(msg))
      ? error.message
      : 'Submission failed. Please try again.';

    const status = safeMessages.some((msg) => error.message?.includes(msg)) ? 400 : 500;
    return createErrorResponse(clientMessage, status);
  }
}
