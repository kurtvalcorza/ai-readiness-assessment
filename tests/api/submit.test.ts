import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/submit/route';

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkSubmissionRateLimit: vi.fn(),
}));

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateAssessmentData: vi.fn(),
}));

import { checkSubmissionRateLimit } from '@/lib/rate-limit';
import { validateAssessmentData } from '@/lib/validation';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('/api/submit', () => {
  const validAssessmentData = {
    organization: 'Test Organization',
    domain: 'Test Domain',
    readinessLevel: 'High',
    solutions: [
      {
        priority: 'Primary',
        category: 'Test Category',
        group: 'Test Group',
        fit: 'High',
        rationale: 'Test rationale',
      },
    ],
    nextSteps: ['Step 1', 'Step 2'],
    timestamp: new Date().toISOString(),
    conversationHistory: '[]',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    (checkSubmissionRateLimit as any).mockResolvedValue({ allowed: true, remaining: 4 });
    (validateAssessmentData as any).mockReturnValue(undefined);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  });

  it('returns 429 when rate limited', async () => {
    (checkSubmissionRateLimit as any).mockResolvedValue({ allowed: false, remaining: 0 });

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error).toContain('Too many submissions');
  });

  it('returns 400 for invalid data structure', async () => {
    (validateAssessmentData as any).mockImplementation(() => {
      throw new Error('Invalid organization field');
    });

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Invalid organization field');
  });

  it('returns 400 for fields exceeding maximum length', async () => {
    const invalidData = {
      ...validAssessmentData,
      organization: 'a'.repeat(501),
    };

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(invalidData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Field values exceed maximum length');
  });

  it('succeeds when webhook URL is not configured', async () => {
    // Don't set GOOGLE_SHEETS_WEBHOOK_URL

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('webhook not configured');
  });

  it('submits to Google Sheets when webhook URL is configured', async () => {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/test';

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Assessment submitted successfully');

    // Verify fetch was called with correct data
    expect(mockFetch).toHaveBeenCalledWith(
      'https://script.google.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Organization'),
      })
    );
  });

  it('handles Google Sheets submission failure', async () => {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/test';
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('Google Sheets submission failed');
  });

  it('formats data correctly for Google Sheets', async () => {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/test';

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody).toEqual({
      timestamp: validAssessmentData.timestamp,
      organization: 'Test Organization',
      domain: 'Test Domain',
      readinessLevel: 'High',
      primarySolution: 'Test Category',
      secondarySolution: '',
      nextSteps: 'Step 1; Step 2',
      conversationHistory: '[]',
    });
  });

  it('includes security headers in all responses', async () => {
    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('handles network errors gracefully', async () => {
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/test';
    mockFetch.mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost/api/submit', {
      method: 'POST',
      body: JSON.stringify(validAssessmentData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('Network error');
  });
});