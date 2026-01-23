/**
 * Utilities for parsing assessment reports
 */

import {
  SOLUTION_PATTERN,
  NEXT_STEPS_PATTERN,
  ASSESSMENT_COMPLETE_MARKER,
} from './constants';
import { AISolution } from './types';

/**
 * Parsed report data
 */
export interface ParsedReport {
  organization: string;
  domain: string;
  readinessLevel: string;
  solutions: AISolution[];
  nextSteps: string[];
}

/**
 * Extracts organization name from report
 * @param report - The assessment report text
 * @returns Organization name or 'Unknown'
 */
export function extractOrganization(report: string): string {
  const match = report.match(/\*\*Organization:\*\*\s*(.+)/);
  return match?.[1]?.trim() || 'Unknown';
}

/**
 * Extracts domain from report
 * @param report - The assessment report text
 * @returns Domain or 'Unknown'
 */
export function extractDomain(report: string): string {
  const match = report.match(/\*\*Domain:\*\*\s*(.+)/);
  return match?.[1]?.trim() || 'Unknown';
}

/**
 * Extracts readiness level from report
 * @param report - The assessment report text
 * @returns Readiness level or 'Unknown'
 */
export function extractReadinessLevel(report: string): string {
  const match = report.match(/\*\*Readiness Level:\*\*\s*(.+)/);
  return match?.[1]?.trim() || 'Unknown';
}

/**
 * Extracts solutions from report using regex pattern
 * @param report - The assessment report text
 * @returns Array of AI solutions
 */
export function extractSolutions(report: string): AISolution[] {
  const solutions: AISolution[] = [];

  // Reset regex state
  const pattern = new RegExp(SOLUTION_PATTERN.source, SOLUTION_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(report)) !== null) {
    solutions.push({
      priority: match[1].trim(),
      category: match[2].trim(),
      group: match[3].trim(),
      fit: match[4].trim(),
      rationale: match[5].trim(),
    });
  }

  return solutions;
}

/**
 * Extracts next steps from report
 * @param report - The assessment report text
 * @returns Array of next steps
 */
export function extractNextSteps(report: string): string[] {
  const nextSteps: string[] = [];
  const match = report.match(NEXT_STEPS_PATTERN);

  if (match) {
    const steps = match[1].split('\n').filter((line) => line.trim());
    steps.forEach((step) => {
      const stepMatch = step.match(/^\d+\.\s+(.+)$/);
      if (stepMatch) {
        nextSteps.push(stepMatch[1].trim());
      }
    });
  }

  return nextSteps;
}

/**
 * Parses complete assessment report
 * @param report - The assessment report text
 * @returns Parsed report data
 */
export function parseAssessmentReport(report: string): ParsedReport {
  return {
    organization: extractOrganization(report),
    domain: extractDomain(report),
    readinessLevel: extractReadinessLevel(report),
    solutions: extractSolutions(report),
    nextSteps: extractNextSteps(report),
  };
}

/**
 * Checks if report contains completion marker
 * @param content - The message content to check
 * @returns True if assessment is complete
 */
export function isAssessmentComplete(content: string): boolean {
  return content.includes(ASSESSMENT_COMPLETE_MARKER);
}

/**
 * Removes assessment completion marker from content
 * @param content - The content to clean
 * @returns Content without marker
 */
export function removeCompletionMarker(content: string): string {
  return content.replace(ASSESSMENT_COMPLETE_MARKER, '').trim();
}
