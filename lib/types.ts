/**
 * Shared TypeScript type definitions for the AI Readiness Assessment application
 */

/**
 * Represents a message part in the chat conversation
 */
export interface MessagePart {
  type: 'text';
  text: string;
}

/**
 * Represents a single message in the chat UI
 */
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

/**
 * Core message format for AI SDK
 */
export interface CoreMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Represents an AI solution recommendation
 */
export interface AISolution {
  priority: string;
  group: string;
  category: string;
  fit: string;
  rationale: string;
}

/**
 * Assessment data submitted to Google Sheets
 */
export interface AssessmentData {
  organization: string;
  domain: string;
  readinessLevel: string;
  solutions: AISolution[];
  nextSteps: string[];
  timestamp: string;
  conversationHistory?: string;
}

/**
 * Formatted data for Google Sheets webhook
 */
export interface GoogleSheetsData {
  timestamp: string;
  organization: string;
  domain: string;
  readinessLevel: string;
  primarySolution: string;
  secondarySolution: string;
  nextSteps: string;
  conversationHistory: string;
}

/**
 * Rate limiting record
 */
export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * API error response
 */
export interface APIError {
  error: string;
  code?: string;
}

/**
 * API success response
 */
export interface APISuccess {
  success: boolean;
  message: string;
}
