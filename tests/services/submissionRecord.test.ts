/**
 * Tests for the shared submission record builder
 */

import { describe, it, expect } from 'vitest';
import { buildSubmissionRecord } from '@/services/submissionRecord';
import { AssessmentData } from '@/lib/types';
import { MAX_CONVERSATION_HISTORY_SIZE } from '@/lib/constants';

describe('buildSubmissionRecord', () => {
  const baseData: AssessmentData = {
    timestamp: '2024-01-15T10:30:00Z',
    organization: 'Test Corp',
    domain: 'Technology',
    readinessLevel: 'Intermediate',
    solutions: [],
    nextSteps: ['Step 1', 'Step 2'],
  };

  it('maps fields identically to the historical Google Sheets format', () => {
    const record = buildSubmissionRecord({
      ...baseData,
      solutions: [
        { priority: 'High', category: 'AI Assistant', group: 'P', fit: 'Good', rationale: 'R' },
        { priority: 'Medium', category: 'Data Analytics', group: 'I', fit: 'Good', rationale: 'R' },
      ],
      conversationHistory: 'User: Hello',
    });

    expect(record).toEqual({
      timestamp: '2024-01-15T10:30:00Z',
      organization: 'Test Corp',
      domain: 'Technology',
      readinessLevel: 'Intermediate',
      primarySolution: 'AI Assistant',
      secondarySolution: 'Data Analytics',
      nextSteps: 'Step 1; Step 2',
      conversationHistory: 'User: Hello',
    });
  });

  it('strips NUL characters from every field', () => {
    const record = buildSubmissionRecord({
      ...baseData,
      organization: 'Acme\u0000Corp',
      domain: 'Tech\u0000nology',
    });

    expect(record.organization).toBe('AcmeCorp');
    expect(record.domain).toBe('Technology');
  });

  it('redacts PII from conversation history server-side', () => {
    const record = buildSubmissionRecord({
      ...baseData,
      conversationHistory: 'Email me at user@example.com please',
    });

    expect(record.conversationHistory).toBe('Email me at [EMAIL_REDACTED] please');
  });

  it('truncates oversized conversation history', () => {
    const record = buildSubmissionRecord({
      ...baseData,
      conversationHistory: 'x'.repeat(MAX_CONVERSATION_HISTORY_SIZE + 1000),
    });

    expect(record.conversationHistory.length).toBeLessThanOrEqual(
      MAX_CONVERSATION_HISTORY_SIZE + '...[truncated]'.length
    );
    expect(record.conversationHistory.endsWith('...[truncated]')).toBe(true);
  });
});
