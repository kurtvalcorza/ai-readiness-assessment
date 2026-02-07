/**
 * HMAC-SHA256 webhook signing utility
 * Signs outbound webhook requests so the receiving Google Apps Script
 * can verify the request originated from this application.
 *
 * Note: Google Apps Script doPost() cannot access custom HTTP headers,
 * so the signature and timestamp are embedded in the JSON body instead.
 */

import { createHmac } from 'crypto';

export const MAX_TIMESTAMP_DRIFT_MS = 300000; // 5 minutes

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
 * Wraps a JSON payload with HMAC signature fields for webhook verification.
 * Returns a new JSON string with _webhookSignature and _webhookTimestamp added.
 */
export function signWebhookPayload(
  data: Record<string, unknown>,
  secret: string
): string {
  // Signature is computed over the original data (without signature fields)
  const body = JSON.stringify(data);
  const timestamp = Date.now();
  const signature = createWebhookSignature(body, secret, timestamp);

  return JSON.stringify({
    ...data,
    _webhookSignature: signature,
    _webhookTimestamp: timestamp,
  });
}
