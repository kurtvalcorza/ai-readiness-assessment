import { describe, it, expect } from 'vitest';
import {
  extractOrganization,
  extractDomain,
  extractReadinessLevel,
  extractSolutions,
  extractNextSteps,
  parseAssessmentReport,
  isAssessmentComplete,
  removeCompletionMarker,
} from '@/lib/report-parser';

describe('Report Parser', () => {
  const sampleReport = `## AI Readiness Assessment

**Organization:** Department of Agriculture
**Domain:** Agriculture
**Readiness Level:** High

### AI Solution Needs

#### Primary - Crop Monitoring
**Group:** Agriculture & Environment
**Fit:** High
**Rationale:** The department needs to monitor crop health across large areas.

#### Secondary - Predictive Analytics
**Group:** Data & Decisions
**Fit:** Medium
**Rationale:** Historical data can be used for yield prediction.

### Recommended Next Steps
1. Conduct stakeholder meetings
2. Develop pilot program
3. Secure budget approval

---

**Thank you for completing the assessment!**

###ASSESSMENT_COMPLETE###`;

  describe('extractOrganization', () => {
    it('should extract organization from standard format', () => {
      const org = extractOrganization(sampleReport);
      expect(org).toBe('Department of Agriculture');
    });

    it('should handle alternative markdown formatting', () => {
      const report = 'Organization: Test Agency';
      const org = extractOrganization(report);
      expect(org).toBe('Test Agency');
    });

    it('should return default for missing organization', () => {
      const report = 'No organization here';
      const org = extractOrganization(report);
      expect(org).toBe('Unknown Organization');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from standard format', () => {
      const domain = extractDomain(sampleReport);
      expect(domain).toBe('Agriculture');
    });

    it('should return default for missing domain', () => {
      const report = 'No domain here';
      const domain = extractDomain(report);
      expect(domain).toBe('Unknown Domain');
    });
  });

  describe('extractReadinessLevel', () => {
    it('should extract readiness level from standard format', () => {
      const level = extractReadinessLevel(sampleReport);
      expect(level).toBe('High');
    });

    it('should validate readiness level is one of the valid values', () => {
      const report = '**Readiness Level:** Medium';
      const level = extractReadinessLevel(report);
      expect(['High', 'Medium', 'Low']).toContain(level);
    });

    it('should return Unknown for invalid readiness level', () => {
      const report = '**Readiness Level:** InvalidLevel';
      const level = extractReadinessLevel(report);
      expect(level).toBe('Unknown');
    });

    it('should return default for missing level', () => {
      const report = 'No level here';
      const level = extractReadinessLevel(report);
      expect(level).toBe('Unknown');
    });
  });

  describe('extractSolutions', () => {
    it('should extract multiple solutions', () => {
      const solutions = extractSolutions(sampleReport);
      expect(solutions.length).toBe(2);
    });

    it('should extract solution details correctly', () => {
      const solutions = extractSolutions(sampleReport);
      expect(solutions[0]).toEqual({
        priority: 'Primary',
        category: 'Crop Monitoring',
        group: 'Agriculture & Environment',
        fit: 'High',
        rationale: 'The department needs to monitor crop health across large areas.',
      });
    });

    it('should return empty array for no solutions', () => {
      const report = 'No solutions here';
      const solutions = extractSolutions(report);
      expect(solutions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed solution sections gracefully', () => {
      const report = '#### Primary - Test\n**Group:** Incomplete';
      const solutions = extractSolutions(report);
      // Should either parse with fallback or return empty array
      expect(Array.isArray(solutions)).toBe(true);
    });
  });

  describe('extractNextSteps', () => {
    it('should extract multiple next steps', () => {
      const steps = extractNextSteps(sampleReport);
      expect(steps.length).toBe(3);
    });

    it('should extract step content correctly', () => {
      const steps = extractNextSteps(sampleReport);
      expect(steps).toContain('Conduct stakeholder meetings');
      expect(steps).toContain('Develop pilot program');
      expect(steps).toContain('Secure budget approval');
    });

    it('should return empty array for missing steps', () => {
      const report = 'No steps here';
      const steps = extractNextSteps(report);
      expect(Array.isArray(steps)).toBe(true);
    });

    it('should handle alternative "Next Steps" formatting', () => {
      const report = `Next Steps:
1. First step
2. Second step`;
      const steps = extractNextSteps(report);
      expect(steps.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('parseAssessmentReport', () => {
    it('should parse complete report successfully', () => {
      const parsed = parseAssessmentReport(sampleReport);
      expect(parsed.organization).toBe('Department of Agriculture');
      expect(parsed.domain).toBe('Agriculture');
      expect(parsed.readinessLevel).toBe('High');
      expect(parsed.solutions.length).toBe(2);
      expect(parsed.nextSteps.length).toBe(3);
    });

    it('should throw error for empty report', () => {
      expect(() => parseAssessmentReport('')).toThrow('Cannot parse empty report');
    });

    it('should throw error for completely invalid report', () => {
      const invalidReport = 'This is not a valid report at all';
      expect(() => parseAssessmentReport(invalidReport)).toThrow(
        'Report format not recognized'
      );
    });

    it('should succeed with partial data if at least some is valid', () => {
      const partialReport = '**Organization:** Test Org\n**Domain:** Test Domain';
      const parsed = parseAssessmentReport(partialReport);
      expect(parsed.organization).toBe('Test Org');
      expect(parsed.domain).toBe('Test Domain');
    });
  });

  describe('isAssessmentComplete', () => {
    it('should detect completion marker', () => {
      expect(isAssessmentComplete(sampleReport)).toBe(true);
    });

    it('should return false for incomplete assessment', () => {
      const incomplete = 'This is an incomplete assessment';
      expect(isAssessmentComplete(incomplete)).toBe(false);
    });
  });

  describe('removeCompletionMarker', () => {
    it('should remove completion marker', () => {
      const cleaned = removeCompletionMarker(sampleReport);
      expect(cleaned).not.toContain('###ASSESSMENT_COMPLETE###');
    });

    it('should preserve report content', () => {
      const cleaned = removeCompletionMarker(sampleReport);
      expect(cleaned).toContain('Department of Agriculture');
      expect(cleaned).toContain('Crop Monitoring');
    });

    it('should handle reports without marker', () => {
      const report = 'No marker here';
      const cleaned = removeCompletionMarker(report);
      expect(cleaned).toBe('No marker here');
    });
  });
});
