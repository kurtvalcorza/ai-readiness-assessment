/**
 * Parsing-related constants
 * Report parsing patterns and markers
 */

/**
 * Parsing configuration namespace
 */
export const PARSING = {
  /**
   * Assessment markers
   */
  MARKERS: {
    ASSESSMENT_COMPLETE: '###ASSESSMENT_COMPLETE###',
  },

  /**
   * Report parsing patterns
   */
  PATTERNS: {
    /**
     * Matches organization field in various formats
     */
    ORGANIZATION: [
      /\*\*Organization:\*\*\s*(.+)/,
      /Organization:\s*(.+)/,
      /\*\*Organization\*\*:\s*(.+)/,
    ],

    /**
     * Matches domain field in various formats
     */
    DOMAIN: [
      /\*\*Domain:\*\*\s*(.+)/,
      /Domain:\s*(.+)/,
      /\*\*Domain\*\*:\s*(.+)/,
    ],

    /**
     * Matches readiness level field in various formats
     */
    READINESS_LEVEL: [
      /\*\*Readiness Level:\*\*\s*(.+)/,
      /Readiness Level:\s*(.+)/,
      /\*\*Readiness Level\*\*:\s*(.+)/,
    ],

    /**
     * Regex pattern for parsing assessment report solutions
     * Matches format: #### Priority - Category
     */
    SOLUTION:
      /####\s+(\w+)\s+-\s+([^\n]+)\n\*\*Group:\*\*\s+([^\n]+)\n\*\*Fit:\*\*\s+([^\n]+)\n\*\*Rationale:\*\*\s+([\s\S]+?)(?=\n####|\n###|\n---|\n\*\*Thank you|$)/g,

    /**
     * Regex pattern for parsing next steps from the report
     * Matches numbered list items
     */
    NEXT_STEPS: /\*\*Recommended Next Steps:\*\*\s*\n((?:\d+\.\s+.+\n?)+)/,
  },

  /**
   * Valid readiness levels
   */
  VALID_LEVELS: ['High', 'Medium', 'Low'] as const,
} as const;

// Legacy exports for backward compatibility
export const ASSESSMENT_COMPLETE_MARKER = PARSING.MARKERS.ASSESSMENT_COMPLETE;
export const SOLUTION_PATTERN = PARSING.PATTERNS.SOLUTION;
export const NEXT_STEPS_PATTERN = PARSING.PATTERNS.NEXT_STEPS;
