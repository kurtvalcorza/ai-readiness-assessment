/**
 * Tests for Neon submission service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssessmentData } from '@/lib/types';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSql),
}));

import { neon } from '@neondatabase/serverless';
import { submitToNeon } from '@/services/neonSubmissionService';

describe('Neon Submission Service', () => {
  const assessmentData: AssessmentData = {
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
    nextSteps: ['Step 1', 'Step 2'],
    conversationHistory: '[]',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    mockSql.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('fails loudly when DATABASE_URL is not configured', async () => {
    delete process.env.DATABASE_URL;

    const result = await submitToNeon(assessmentData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('DATABASE_URL is not configured');
    expect(neon).not.toHaveBeenCalled();
  });

  it('inserts the assessment and reports success', async () => {
    const result = await submitToNeon(assessmentData);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Assessment submitted successfully');
    expect(mockSql).toHaveBeenCalledTimes(1);

    // Tagged template call: [strings, ...values]
    const values = mockSql.mock.calls[0].slice(1);
    expect(values).toEqual([
      '2024-01-15T10:30:00Z',
      'Test Corp',
      'Technology',
      'Intermediate',
      'AI Assistant',
      '', // no secondary solution
      'Step 1; Step 2',
      '[]',
    ]);
  });

  it('configures the client with an abort signal so hung queries time out', async () => {
    await submitToNeon(assessmentData);

    expect(neon).toHaveBeenCalledWith(
      'postgresql://user:pass@host/db',
      expect.objectContaining({
        fetchOptions: expect.objectContaining({ signal: expect.any(AbortSignal) }),
      })
    );
  });

  it('strips NUL characters and redacts PII before inserting', async () => {
    await submitToNeon({
      ...assessmentData,
      organization: 'Acme\u0000Corp',
      conversationHistory: 'Contact me at user@example.com',
    });

    const values = mockSql.mock.calls[0].slice(1);
    expect(values[1]).toBe('AcmeCorp');
    expect(values[7]).toBe('Contact me at [EMAIL_REDACTED]');
  });

  it('returns a failure result when the insert throws', async () => {
    mockSql.mockRejectedValue(new Error('relation "assessments" does not exist'));

    const result = await submitToNeon(assessmentData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Submission failed. Please try again.');
    expect(result.error).toContain('relation "assessments" does not exist');
  });

  it('handles non-Error throws without crashing', async () => {
    mockSql.mockRejectedValue('connection reset');

    const result = await submitToNeon(assessmentData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('connection reset');
  });
});
