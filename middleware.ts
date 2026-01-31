/**
 * Next.js middleware for security headers
 * 
 * Note: This app is designed to be embedded as an iframe in the ACABAI-PH website,
 * so frame-ancestors CSP directive allows embedding from trusted domains.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Content Security Policy - Allow iframe embedding from trusted domains
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://*.vercel.app https://*.netlify.app https://*.github.io https://*.pages.dev https://localhost:* http://localhost:*;
    connect-src 'self' https://generativelanguage.googleapis.com https://script.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com;
    worker-src 'self' blob:;
  `.replace(/\s{2,}/g, ' ').trim();

  // Security headers - Remove X-Frame-Options to allow CSP frame-ancestors to control framing
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  // Removed X-Frame-Options to let CSP frame-ancestors handle iframe embedding
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-DNS-Prefetch-Control', 'false');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};