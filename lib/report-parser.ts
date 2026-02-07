/**
 * Utilities for parsing assessment reports
 */

import {
  SOLUTION_PATTERN,
  NEXT_STEPS_PATTERN,
  ASSESSMENT_COMPLETE_MARKER,
} from './constants';
import { PARSING } from './constants/parsing';
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
 * Configuration for pattern-based extraction
 */
interface PatternConfig {
  patterns: readonly RegExp[];
  validator?: (value: string) => boolean;
  fallback: string;
  fieldName: string;
}

/**
 * Generic helper function for extracting fields using multiple patterns
 * @param report - The assessment report text
 * @param config - Pattern configuration
 * @returns Extracted value or fallback
 */
function extractWithPatterns(report: string, config: PatternConfig): string {
  for (const pattern of config.patterns) {
    const match = report.match(pattern);
    if (match?.[1]?.trim()) {
      const value = match[1].trim();
      // Apply validator if provided
      if (!config.validator || config.validator(value)) {
        return value;
      }
    }
  }

  console.warn(`Could not extract ${config.fieldName} from report`);
  return config.fallback;
}

/**
 * Extracts organization name from report
 * @param report - The assessment report text
 * @returns Organization name or 'Unknown'
 */
export function extractOrganization(report: string): string {
  return extractWithPatterns(report, {
    patterns: PARSING.PATTERNS.ORGANIZATION,
    fallback: 'Unknown Organization',
    fieldName: 'organization',
  });
}

/**
 * Extracts domain from report
 * @param report - The assessment report text
 * @returns Domain or 'Unknown'
 */
export function extractDomain(report: string): string {
  return extractWithPatterns(report, {
    patterns: PARSING.PATTERNS.DOMAIN,
    fallback: 'Unknown Domain',
    fieldName: 'domain',
  });
}

/**
 * Extracts readiness level from report
 * @param report - The assessment report text
 * @returns Readiness level or 'Unknown'
 */
export function extractReadinessLevel(report: string): string {
  return extractWithPatterns(report, {
    patterns: PARSING.PATTERNS.READINESS_LEVEL,
    validator: (value) =>
      PARSING.VALID_LEVELS.some((level) =>
        value.toLowerCase().includes(level.toLowerCase())
      ),
    fallback: 'Unknown',
    fieldName: 'readiness level',
  });
}

/**
 * Extracts solutions from report using regex pattern
 * @param report - The assessment report text
 * @returns Array of AI solutions
 */
export function extractSolutions(report: string): AISolution[] {
  const solutions: AISolution[] = [];

  try {
    // Reset regex state
    const pattern = new RegExp(SOLUTION_PATTERN.source, SOLUTION_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(report)) !== null) {
      // Validate all fields are present
      if (match[1] && match[2] && match[3] && match[4] && match[5]) {
        solutions.push({
          priority: match[1].trim(),
          category: match[2].trim(),
          group: match[3].trim(),
          fit: match[4].trim(),
          rationale: match[5].trim(),
        });
      } else {
        console.warn('Incomplete solution data found, skipping:', match);
      }
    }

    if (solutions.length === 0) {
      console.warn('No solutions found in report using primary pattern');

      // Fallback: try to find solutions in a simpler format
      const fallbackPattern = /####\s+(\w+)\s+-\s+([^\n]+)/g;
      let fallbackMatch: RegExpExecArray | null;

      while ((fallbackMatch = fallbackPattern.exec(report)) !== null) {
        solutions.push({
          priority: fallbackMatch[1].trim(),
          category: fallbackMatch[2].trim(),
          group: 'Not specified',
          fit: 'Not specified',
          rationale: 'Details not available in report format',
        });
      }
    }
  } catch (error) {
    console.error('Error extracting solutions:', error);
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

  try {
    // Try primary pattern
    const match = report.match(NEXT_STEPS_PATTERN);

    if (match) {
      const steps = match[1].split('\n').filter((line) => line.trim());
      steps.forEach((step) => {
        const stepMatch = step.match(/^\d+\.\s+(.+)$/);
        if (stepMatch && stepMatch[1].trim()) {
          nextSteps.push(stepMatch[1].trim());
        }
      });
    }

    // Fallback: try alternative patterns
    if (nextSteps.length === 0) {
      console.warn('No next steps found using primary pattern, trying fallback');

      // Look for any numbered list after "Next Steps" or "Recommended"
      const fallbackPatterns = [
        /Next Steps[:\s]*\n((?:\d+\.\s+.+\n?)+)/i,
        /Recommended[:\s]*\n((?:\d+\.\s+.+\n?)+)/i,
      ];

      for (const pattern of fallbackPatterns) {
        const fallbackMatch = report.match(pattern);
        if (fallbackMatch) {
          const steps = fallbackMatch[1].split('\n').filter((line) => line.trim());
          steps.forEach((step) => {
            const stepMatch = step.match(/^\d+\.\s+(.+)$/);
            if (stepMatch && stepMatch[1].trim()) {
              nextSteps.push(stepMatch[1].trim());
            }
          });

          if (nextSteps.length > 0) break;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting next steps:', error);
  }

  if (nextSteps.length === 0) {
    console.warn('Could not extract next steps from report');
  }

  return nextSteps;
}

/**
 * Parses complete assessment report
 * @param report - The assessment report text
 * @returns Parsed report data
 * @throws {Error} If critical data cannot be extracted
 */
export function parseAssessmentReport(report: string): ParsedReport {
  if (!report || report.trim().length === 0) {
    throw new Error('Cannot parse empty report');
  }

  const parsed: ParsedReport = {
    organization: extractOrganization(report),
    domain: extractDomain(report),
    readinessLevel: extractReadinessLevel(report),
    solutions: extractSolutions(report),
    nextSteps: extractNextSteps(report),
  };

  // Validate that we extracted meaningful data
  const hasValidData =
    parsed.organization !== 'Unknown Organization' ||
    parsed.domain !== 'Unknown Domain' ||
    parsed.solutions.length > 0 ||
    parsed.nextSteps.length > 0;

  if (!hasValidData) {
    console.error('Failed to extract meaningful data from report');
    console.error('Report preview:', report.substring(0, 500));
    throw new Error(
      'Report format not recognized. The assessment may not have completed properly.'
    );
  }

  // Log warnings for missing optional data
  if (parsed.solutions.length === 0) {
    console.warn('No solutions extracted from report');
  }
  if (parsed.nextSteps.length === 0) {
    console.warn('No next steps extracted from report');
  }

  return parsed;
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
