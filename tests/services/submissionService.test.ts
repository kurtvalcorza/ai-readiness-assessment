/**
 * Tests for submission service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatForGoogleSheets,
  signPayload,
  submitAssessment,
} from '@/services/submissionService';
import { AssessmentData } from '@/lib/types';

describe('Submission Service', () => {
  describe('formatForGoogleSheets', () => {
    it('should format complete assessment data correctly', () => {
      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [
          {
            priority: 'High',
            category: 'AI Assistant',
            group: 'Productivity',
            fit: 'Excellent',
            rationale: 'Improves efficiency',
          },
          {
            priority: 'Medium',
            category: 'Data Analytics',
            group: 'Insights',
            fit: 'Good',
            rationale: 'Better decisions',
          },
        ],
        nextSteps: ['Step 1', 'Step 2', 'Step 3'],
        conversationHistory: 'User: Hello\nAssistant: Hi there',
      };

      const result = formatForGoogleSheets(data);

      expect(result).toEqual({
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        primarySolution: 'AI Assistant',
        secondarySolution: 'Data Analytics',
        nextSteps: 'Step 1; Step 2; Step 3',
        conversationHistory: 'User: Hello\nAssistant: Hi there',
      });
    });

    it('should handle missing solutions gracefully', () => {
      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Beginner',
        solutions: [],
        nextSteps: ['Step 1'],
      };

      const result = formatForGoogleSheets(data);

      expect(result.primarySolution).toBe('');
      expect(result.secondarySolution).toBe('');
    });

    it('should handle missing conversation history', () => {
      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Advanced',
        solutions: [],
        nextSteps: [],
      };

      const result = formatForGoogleSheets(data);

      expect(result.conversationHistory).toBe('');
    });

    it('should handle only one solution', () => {
      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [
          {
            priority: 'High',
            category: 'AI Assistant',
            group: 'Productivity',
            fit: 'Excellent',
            rationale: 'Improves efficiency',
          },
        ],
        nextSteps: [],
      };

      const result = formatForGoogleSheets(data);

      expect(result.primarySolution).toBe('AI Assistant');
      expect(result.secondarySolution).toBe('');
    });
  });

  describe('signPayload', () => {
    it('should return signed payload when secret is provided', () => {
      const data = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        primarySolution: 'AI Assistant',
        secondarySolution: 'Data Analytics',
        nextSteps: 'Step 1; Step 2',
        conversationHistory: '',
      };

      const result = signPayload(data, 'test-secret');
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('_webhookPayload');
      expect(parsed).toHaveProperty('_webhookSignature');
      expect(parsed).toHaveProperty('_webhookTimestamp');
      expect(JSON.parse(parsed._webhookPayload)).toEqual(data);
    });

    it('should return unsigned JSON when no secret is provided', () => {
      const data = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        primarySolution: 'AI Assistant',
        secondarySolution: '',
        nextSteps: 'Step 1',
        conversationHistory: '',
      };

      const result = signPayload(data);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
      expect(parsed).not.toHaveProperty('signature');
    });
  });

  describe('submitAssessment', () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockReset();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return success when webhook is not configured', async () => {
      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      const result = await submitAssessment(data, {});

      expect(result.success).toBe(true);
      expect(result.message).toContain('webhook not configured');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should submit successfully with webhook configured', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      const result = await submitAssessment(data, {
        webhookUrl: 'https://example.com/webhook',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Assessment submitted successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      const result = await submitAssessment(data, {
        webhookUrl: 'https://example.com/webhook',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Submission failed. Please try again.');
      expect(result.error).toBe('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      const result = await submitAssessment(data, {
        webhookUrl: 'https://example.com/webhook',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Google Sheets submission failed');
    });

    it('should handle Google Sheets script errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Script error' }),
      });

      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      const result = await submitAssessment(data, {
        webhookUrl: 'https://example.com/webhook',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Google Sheets script error');
    });

    it('should sign payload when signing secret is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const data: AssessmentData = {
        timestamp: '2024-01-15T10:30:00Z',
        organization: 'Test Corp',
        domain: 'Technology',
        readinessLevel: 'Intermediate',
        solutions: [],
        nextSteps: [],
      };

      await submitAssessment(data, {
        webhookUrl: 'https://example.com/webhook',
        signingSecret: 'test-secret',
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      const parsed = JSON.parse(callBody);

      expect(parsed).toHaveProperty('_webhookSignature');
      expect(parsed).toHaveProperty('_webhookPayload');
      expect(parsed).toHaveProperty('_webhookTimestamp');
    });
  });
});
