/**
 * HMAC-SHA256 webhook signing utility
 * Signs outbound webhook requests so the receiving Google Apps Script
 * can verify the request originated from this application.
 */

import { createHmac } from 'crypto';

const SIGNATURE_HEADER = 'X-Webhook-Signature';
const TIMESTAMP_HEADER = 'X-Webhook-Timestamp';
const MAX_TIMESTAMP_DRIFT_MS = 300000; // 5 minutes

/**
 * Creates an HMAC-SHA256 signature for a webhook payload
 * The signed message is: `${timestamp}.${body}` to prevent replay attacks
 */
export function createWebhookSignature(
  body: string,
  secret: string,
  timestamp: number
): string {
  const message = `${timestamp}.${body}`;
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Returns signed headers to attach to an outbound webhook request
 */
export function getSignedWebhookHeaders(
  body: string,
  secret: string
): Record<string, string> {
  const timestamp = Date.now();
  const signature = createWebhookSignature(body, secret, timestamp);

  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: String(timestamp),
  };
}

// Export header names for documentation / Apps Script reference
export { SIGNATURE_HEADER, TIMESTAMP_HEADER, MAX_TIMESTAMP_DRIFT_MS };
