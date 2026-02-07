/**
 * HMAC-SHA256 webhook signing utility
 * Signs the raw HTTP body so the receiver can verify using e.postData.contents
 * without any JSON parsing/re-serialization issues.
 *
 * The signature and timestamp are sent as URL query parameters appended to
 * the webhook URL, since Google Apps Script can access query params via e.parameter.
 */

import { createHmac } from 'crypto';

export const MAX_TIMESTAMP_DRIFT_MS = 300000; // 5 minutes

/**
 * Signs a webhook payload and returns the body string + query params to append to the URL.
 */
export function signWebhookRequest(
  data: object,
  secret: string
): { body: string; queryParams: string } {
  const body = JSON.stringify(data);
  const timestamp = Date.now();
  const message = `${timestamp}.${body}`;
  const signature = createHmac('sha256', secret).update(message, 'utf8').digest('hex');

  return {
    body,
    queryParams: `?_sig=${signature}&_ts=${timestamp}`,
  };
}
