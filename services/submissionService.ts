/**
 * Submission Service
 * Handles assessment data formatting and submission to Google Sheets
 */

import { signWebhookPayload } from '@/lib/webhook-signing';
import { AssessmentData, GoogleSheetsData } from '@/lib/types';

export interface SubmissionConfig {
  webhookUrl?: string;
  signingSecret?: string;
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Formats assessment data for Google Sheets submission
 * @param data - The assessment data to format
 * @returns Formatted data ready for Google Sheets
 */
export function formatForGoogleSheets(data: AssessmentData): GoogleSheetsData {
  return {
    timestamp: data.timestamp,
    organization: data.organization,
    domain: data.domain,
    readinessLevel: data.readinessLevel,
    primarySolution: data.solutions[0]?.category || '',
    secondarySolution: data.solutions[1]?.category || '',
    nextSteps: data.nextSteps.join('; '),
    conversationHistory: data.conversationHistory || '',
  };
}

/**
 * Signs the payload if a signing secret is provided
 * @param data - The data to sign
 * @param signingSecret - Optional signing secret
 * @returns JSON string (signed or unsigned)
 */
export function signPayload(data: GoogleSheetsData, signingSecret?: string): string {
  if (signingSecret) {
    return signWebhookPayload(data, signingSecret);
  }
  return JSON.stringify(data);
}

/**
 * Submits assessment data to Google Sheets webhook
 * @param data - The assessment data to submit
 * @param config - Submission configuration
 * @returns Submission result
 */
export async function submitAssessment(
  data: AssessmentData,
  config: SubmissionConfig
): Promise<SubmissionResult> {
  // Check if webhook is configured
  if (!config.webhookUrl) {
    console.warn('Google Sheets webhook URL not configured');
    return {
      success: true,
      message: 'Data received (webhook not configured)',
    };
  }

  try {
    // Format data for Google Sheets
    const formattedData = formatForGoogleSheets(data);

    // Sign payload if secret is provided
    const body = signPayload(formattedData, config.signingSecret);

    // Submit to webhook
    const response = await fetch(config.webhookUrl, {
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

    return {
      success: true,
      message: 'Assessment submitted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Submission failed. Please try again.',
      error: error.message,
    };
  }
}
