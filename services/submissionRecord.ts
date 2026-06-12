/**
 * Submission Record Builder
 * Single source of truth for mapping AssessmentData to the flat record
 * persisted by every storage backend (Google Sheets, Neon PostgreSQL),
 * so the backends cannot drift apart.
 */

import { AssessmentData, GoogleSheetsData } from '@/lib/types';
import { sanitizePII, truncateText } from '@/lib/validation';
import { MAX_CONVERSATION_HISTORY_SIZE } from '@/lib/constants';

export type SubmissionRecord = GoogleSheetsData;

/**
 * PostgreSQL TEXT columns cannot store NUL characters; strip them so the
 * same validated payload behaves identically on every backend.
 */
function stripNullChars(text: string): string {
  return text.replace(/\u0000/g, '');
}

/**
 * Builds the storage record for an assessment submission.
 * Re-applies PII redaction and the conversation-history size cap
 * server-side, since client-side sanitization can be bypassed by
 * calling the API directly.
 *
 * @param data - The validated assessment data
 * @returns Flat record ready for any storage backend
 */
export function buildSubmissionRecord(data: AssessmentData): SubmissionRecord {
  const conversationHistory = truncateText(
    sanitizePII(data.conversationHistory || ''),
    MAX_CONVERSATION_HISTORY_SIZE
  );

  return {
    timestamp: stripNullChars(data.timestamp),
    organization: stripNullChars(data.organization),
    domain: stripNullChars(data.domain),
    readinessLevel: stripNullChars(data.readinessLevel),
    primarySolution: stripNullChars(data.solutions[0]?.category || ''),
    secondarySolution: stripNullChars(data.solutions[1]?.category || ''),
    nextSteps: stripNullChars(data.nextSteps.join('; ')),
    conversationHistory: stripNullChars(conversationHistory),
  };
}
