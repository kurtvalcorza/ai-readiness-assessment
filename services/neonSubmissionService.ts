/**
 * Neon Submission Service
 * Handles assessment data insertion into a Neon (serverless PostgreSQL) database.
 *
 * Required environment variable:
 *   DATABASE_URL  — the connection string from your Neon project dashboard
 *                   e.g. postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
 *
 * Run schema.sql once in your Neon console before enabling this service.
 */

import { neon } from '@neondatabase/serverless';
import { AssessmentData } from '@/lib/types';
import { SubmissionResult } from './submissionService';
import { buildSubmissionRecord } from './submissionRecord';
import { safeLogError } from '@/lib/safe-logger';

// Abort a hung Neon HTTP call well before the route's 30s maxDuration,
// so the client still receives the JSON error body instead of a platform timeout.
const QUERY_TIMEOUT_MS = 10_000;

/**
 * Submits assessment data to Neon PostgreSQL.
 * Mirrors the shape of submitAssessment() in submissionService.ts
 * so the route handler can call either interchangeably.
 *
 * @param data - The validated assessment data
 * @returns SubmissionResult
 */
export async function submitToNeon(data: AssessmentData): Promise<SubmissionResult> {
  if (!process.env.DATABASE_URL) {
    // Fail loudly: this service is only selected when Neon is configured or
    // explicitly requested, so a missing DATABASE_URL is a deployment error,
    // not a benign "storage disabled" state.
    console.error('[neonSubmission] DATABASE_URL is not configured - assessment cannot be stored');
    return {
      success: false,
      message: 'Submission failed. Please try again.',
      error: 'DATABASE_URL is not configured',
    };
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort('Neon query timed out'), QUERY_TIMEOUT_MS);

  try {
    const sql = neon(process.env.DATABASE_URL, {
      fetchOptions: { signal: abortController.signal },
    });
    const record = buildSubmissionRecord(data);

    await sql`
      INSERT INTO assessments (
        timestamp,
        organization,
        domain,
        readiness_level,
        primary_solution,
        secondary_solution,
        next_steps,
        conversation_history
      ) VALUES (
        ${record.timestamp},
        ${record.organization},
        ${record.domain},
        ${record.readinessLevel},
        ${record.primarySolution},
        ${record.secondarySolution},
        ${record.nextSteps},
        ${record.conversationHistory}
      )
    `;

    console.log('[neonSubmission] Assessment inserted successfully');
    return {
      success: true,
      message: 'Assessment submitted successfully',
    };
  } catch (error: unknown) {
    safeLogError('[neonSubmission] Error inserting assessment', error);
    return {
      success: false,
      message: 'Submission failed. Please try again.',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
