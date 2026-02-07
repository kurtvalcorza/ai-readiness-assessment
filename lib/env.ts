/**
 * Environment variable validation utility
 * Uses Zod for type-safe validation with helpful error messages
 */

import { envSchema, type Env } from './schemas';
import { ZodError } from 'zod';

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Formats Zod validation errors into helpful error messages
 */
function formatZodError(error: ZodError): string {
  const missingVars = error.issues
    .filter(issue => issue.code === 'too_small' || issue.code === 'invalid_type')
    .map(issue => issue.path.join('.'));

  const invalidVars = error.issues
    .filter(issue => issue.code === 'invalid_string')
    .map(issue => `${issue.path.join('.')}: ${issue.message}`);

  const messages = [
    '❌ Environment validation failed:',
    '',
  ];

  if (missingVars.length > 0) {
    messages.push('Missing or invalid required variables:');
    messages.push(...missingVars.map(v => `  - ${v}`));
    messages.push('');
  }

  if (invalidVars.length > 0) {
    messages.push('Invalid variable formats:');
    messages.push(...invalidVars.map(v => `  - ${v}`));
    messages.push('');
  }

  messages.push(
    'Please follow these steps:',
    '1. Copy .env.example to .env.local',
    '2. Fill in your Google AI API key from https://aistudio.google.com/app/apikey',
    '3. Restart the development server',
    '',
    'For production deployment, add these variables in your hosting platform settings.'
  );

  return messages.join('\n');
}

/**
 * Validates that all required environment variables are set
 * @throws {EnvValidationError} If required variables are missing or invalid
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
      WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Warn about optional variables
    if (!env.GOOGLE_SHEETS_WEBHOOK_URL) {
      console.warn('⚠️  GOOGLE_SHEETS_WEBHOOK_URL not set - Google Sheets integration disabled');
      console.warn('   Assessment responses will not be saved to Google Sheets');
    }

    if (env.GOOGLE_SHEETS_WEBHOOK_URL && !env.WEBHOOK_SIGNING_SECRET) {
      console.warn('⚠️  WEBHOOK_SIGNING_SECRET not set - webhook requests will not be signed');
      console.warn('   Set this to enable HMAC verification on your Google Apps Script');
    }

    return env;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new EnvValidationError(formatZodError(error));
    }
    throw error;
  }
}

/**
 * Gets validated environment config
 * Safe to use after validateEnv() has been called
 */
export function getEnv(): Env {
  return {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
    WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  };
}
