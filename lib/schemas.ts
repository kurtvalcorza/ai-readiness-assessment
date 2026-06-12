/**
 * Zod schemas for runtime validation and type inference
 * Provides type-safe validation for environment variables and API data
 */

import { z } from 'zod';
import { VALIDATION } from './constants/validation';

/**
 * Environment variables schema
 * Validates required configuration at startup
 */
export const envSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'API key is required'),
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  WEBHOOK_SIGNING_SECRET: z.string().optional(),
  DATABASE_URL: z.string().url().optional().or(z.literal('')),
  // Validated as a plain string here; unknown values warn (in validateEnv and
  // resolveStorageProvider) rather than hard-failing every API request.
  STORAGE_PROVIDER: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Assessment data schema
 * Validates assessment report data before submission
 */
export const assessmentDataSchema = z.object({
  organization: z.string().min(1).max(VALIDATION.ORGANIZATION.MAX_LENGTH),
  domain: z.string().min(1).max(VALIDATION.DOMAIN.MAX_LENGTH),
  readinessLevel: z.string().min(1).max(VALIDATION.ASSESSMENT.MAX_READINESS_LEVEL_LENGTH),
  solutions: z
    .array(
      z.object({
        priority: z.string().max(VALIDATION.ASSESSMENT.MAX_SOLUTION_FIELD_LENGTH),
        category: z.string().max(VALIDATION.ASSESSMENT.MAX_SOLUTION_FIELD_LENGTH),
        group: z.string().max(VALIDATION.ASSESSMENT.MAX_SOLUTION_FIELD_LENGTH),
        fit: z.string().max(VALIDATION.ASSESSMENT.MAX_SOLUTION_FIELD_LENGTH),
        rationale: z.string().max(VALIDATION.ASSESSMENT.MAX_SOLUTION_FIELD_LENGTH),
      })
    )
    .max(VALIDATION.ASSESSMENT.MAX_SOLUTIONS),
  nextSteps: z
    .array(z.string().max(VALIDATION.ASSESSMENT.MAX_NEXT_STEP_LENGTH))
    .max(VALIDATION.ASSESSMENT.MAX_NEXT_STEPS),
  timestamp: z.string().datetime(),
  conversationHistory: z.string().max(VALIDATION.ASSESSMENT.MAX_HISTORY_PAYLOAD_SIZE).optional(),
});

export type AssessmentData = z.infer<typeof assessmentDataSchema>;
