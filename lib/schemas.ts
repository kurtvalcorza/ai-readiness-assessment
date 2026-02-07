/**
 * Zod schemas for runtime validation and type inference
 * Provides type-safe validation for environment variables and API data
 */

import { z } from 'zod';

/**
 * Environment variables schema
 * Validates required configuration at startup
 */
export const envSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'API key is required'),
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().url().optional(),
  WEBHOOK_SIGNING_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Assessment data schema
 * Validates assessment report data before submission
 */
export const assessmentDataSchema = z.object({
  organization: z.string().min(1).max(500),
  domain: z.string().min(1).max(500),
  readinessLevel: z.string().min(1),
  solutions: z.array(
    z.object({
      priority: z.string(),
      category: z.string(),
      group: z.string(),
      fit: z.string(),
      rationale: z.string(),
    })
  ),
  nextSteps: z.array(z.string()),
  timestamp: z.string().datetime(),
  conversationHistory: z.string().optional(),
});

export type AssessmentData = z.infer<typeof assessmentDataSchema>;
