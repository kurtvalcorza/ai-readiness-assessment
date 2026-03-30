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
import { safeLogError } from '@/lib/safe-logger';

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
    console.warn('[neonSubmission] DATABASE_URL is not configured');
    return {
      success: true,
      message: 'Data received (database not configured)',
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

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
        ${data.timestamp},
        ${data.organization},
        ${data.domain},
        ${data.readinessLevel},
        ${data.solutions[0]?.category ?? ''},
        ${data.solutions[1]?.category ?? ''},
        ${data.nextSteps.join('; ')},
        ${data.conversationHistory ?? ''}
      )
    `;

    console.log('[neonSubmission] Assessment inserted successfully');
    return {
      success: true,
      message: 'Assessment submitted successfully',
    };
  } catch (error: any) {
    safeLogError('[neonSubmission] Error inserting assessment', error);
    return {
      success: false,
      message: 'Submission failed. Please try again.',
      error: error.message,
    };
  }
}
