/**
 * CSP Violation Reporting Endpoint
 * Logs Content Security Policy violations for monitoring and debugging
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    'violated-directive': string;
    'blocked-uri': string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'status-code'?: number;
  };
}

/**
 * POST handler for CSP violation reports
 * @param req - The incoming request with CSP violation data
 */
export async function POST(req: NextRequest) {
  try {
    const report: CSPReport = await req.json();
    const violation = report['csp-report'];

    // Log violation details
    console.error('🚨 CSP Violation Detected:', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent'),
    });

    // In production, you might want to:
    // 1. Send to monitoring service (Sentry, LogRocket, etc.)
    // 2. Store in database for analysis
    // 3. Alert on repeated violations
    // 4. Track violation patterns

    // Example: Send to external monitoring (uncomment if using Sentry)
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureMessage('CSP Violation', {
    //     level: 'warning',
    //     extra: violation,
    //   });
    // }

    return new Response('OK', { status: 204 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new Response('Error', { status: 500 });
  }
}

/**
 * GET handler - returns information about CSP reporting
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/csp-report',
    purpose: 'Content Security Policy violation reporting',
    method: 'POST',
    note: 'This endpoint receives CSP violation reports from the browser',
  });
}
