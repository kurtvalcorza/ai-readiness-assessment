/**
 * Safe Logger Utility
 * Provides PII-safe logging functions that sanitize sensitive data
 * before it reaches console output.
 */

import type { SubmissionResult } from '@/services/submissionService';

/**
 * Returns a safe, non-PII indicator for an organization name.
 * Never includes the raw organization string in output.
 */
export function safeLogOrganization(org: string | undefined): string {
  return org ? 'provided=true' : 'provided=false';
}

/**
 * Returns a safe summary of a submission result.
 * Only exposes the success boolean, never the full serialized object.
 */
export function safeLogSubmissionResult(result: SubmissionResult): string {
  return `success=${result.success}`;
}

/**
 * Logs a sanitized error with only the error type/name.
 * Never includes error.message or error.stack in output.
 */
export function safeLogError(prefix: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(prefix, `[${error.constructor.name}]`);
  } else {
    console.error(prefix, `[${typeof error}]`);
  }
}
