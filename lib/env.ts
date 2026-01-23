/**
 * Environment variable validation utility
 * Checks for required environment variables and provides helpful error messages
 */

interface EnvConfig {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  GOOGLE_SHEETS_WEBHOOK_URL?: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates that all required environment variables are set
 * @throws {EnvValidationError} If required variables are missing
 */
export function validateEnv(): EnvConfig {
  const missingVars: string[] = [];

  // Check required variables
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    missingVars.push('GOOGLE_GENERATIVE_AI_API_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missingVars.map(v => `  - ${v}`),
      '',
      'Please follow these steps:',
      '1. Copy .env.example to .env.local',
      '2. Fill in your Google AI API key from https://aistudio.google.com/app/apikey',
      '3. Restart the development server',
      '',
      'For production deployment, add these variables in your hosting platform settings.',
    ].join('\n');

    throw new EnvValidationError(errorMessage);
  }

  // Warn about optional variables
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn('⚠️  GOOGLE_SHEETS_WEBHOOK_URL not set - Google Sheets integration disabled');
    console.warn('   Assessment responses will not be saved to Google Sheets');
  }

  return {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
  };
}

/**
 * Gets validated environment config
 * Safe to use after validateEnv() has been called
 */
export function getEnv(): EnvConfig {
  return {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
  };
}
