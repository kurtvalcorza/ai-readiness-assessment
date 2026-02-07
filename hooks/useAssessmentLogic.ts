/**
 * Custom hook for managing assessment state and logic
 * 
 * Handles assessment completion detection, report parsing, submission to backend,
 * and request timeout management. Encapsulates all assessment-related state and
 * side effects in a single, testable hook.
 * 
 * @returns Tuple of [AssessmentState, AssessmentActions]
 * 
 * @example
 * ```tsx
 * const [assessmentState, assessmentActions] = useAssessmentLogic();
 * 
 * // Check for completion after messages update
 * useEffect(() => {
 *   assessmentActions.checkCompletion(messages);
 * }, [messages, assessmentActions]);
 * 
 * // Handle message submission with timeout
 * const handleSubmit = (text: string) => {
 *   assessmentActions.handleSendMessage(text, sendMessage);
 * };
 * ```
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { UIMessage, AssessmentData } from '@/lib/types';
import { sanitizeConversationHistory } from '@/lib/validation';
import { hasAcceptedConsent } from '@/lib/consent';
import {
  parseAssessmentReport,
  isAssessmentComplete,
  removeCompletionMarker,
} from '@/lib/report-parser';

/**
 * Assessment state interface
 */
export interface AssessmentState {
  /** Whether the assessment has been completed */
  isComplete: boolean;
  /** The cleaned assessment report content */
  report: string;
  /** Error message from submission attempt */
  submissionError: string;
  /** Whether a message is currently being submitted */
  isSubmitting: boolean;
}

/**
 * Send message function type from useChat
 */
export type SendMessageFn = (message: { text: string }) => Promise<void>;

/**
 * Assessment actions interface
 */
export interface AssessmentActions {
  /** Check if the latest message indicates assessment completion */
  checkCompletion: (messages: UIMessage[]) => void;
  /** Handle message submission with timeout management */
  handleSendMessage: (text: string, sendMessage: SendMessageFn) => Promise<void>;
  /** Reset assessment state for a new assessment */
  reset: () => void;
  /** Clear submission error message */
  clearError: () => void;
}

/**
 * Request timeout duration in milliseconds
 */
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Custom hook for assessment logic
 */
export function useAssessmentLogic(): [AssessmentState, AssessmentActions] {
  const [state, setState] = useState<AssessmentState>({
    isComplete: false,
    report: '',
    submissionError: '',
    isSubmitting: false,
  });

  const hasSubmittedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Submits assessment data to the backend
   */
  const submitAssessment = useCallback(
    async (conversationMessages: UIMessage[], report: string): Promise<void> => {
      try {
        const parsed = parseAssessmentReport(report);
        const sanitizedHistory = sanitizeConversationHistory(conversationMessages);

        const data: AssessmentData = {
          organization: parsed.organization,
          domain: parsed.domain,
          readinessLevel: parsed.readinessLevel,
          solutions: parsed.solutions,
          nextSteps: parsed.nextSteps,
          timestamp: new Date().toISOString(),
          conversationHistory: sanitizedHistory,
        };

        // Check consent before submitting to Google Sheets
        if (!hasAcceptedConsent()) {
          console.log('User declined consent - skipping Google Sheets submission');
          setState((prev) => ({
            ...prev,
            submissionError:
              'Assessment complete! Your data was not saved per your privacy preference. ' +
              'You can still download your report below.',
          }));
          return;
        }

        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to submit assessment');
        }
      } catch (error) {
        console.error('Failed to submit assessment:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to submit assessment';
        setState((prev) => ({
          ...prev,
          submissionError: `Warning: ${errorMessage}. Your assessment is still complete and can be downloaded below.`,
        }));
      }
    },
    []
  );

  /**
   * Checks for assessment completion and triggers submission
   */
  const checkCompletion = useCallback(
    (messages: UIMessage[]) => {
      // Early exit if already submitted — prevents race condition from rapid useEffect calls
      if (hasSubmittedRef.current) return;

      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        // Get text parts
        const textParts = lastMessage.parts.filter((p) => p.type === 'text');

        // Check if the last text part is still streaming
        // The AI SDK sets state to 'streaming' during stream and 'done' when complete
        const lastTextPart = textParts[textParts.length - 1] as { type: 'text'; text: string; state?: 'streaming' | 'done' } | undefined;
        if (lastTextPart?.state === 'streaming') {
          // Still streaming, don't check for completion yet
          return;
        }

        const content = textParts
          .map((p) => p.text)
          .join('');

        if (isAssessmentComplete(content)) {
          // Set ref immediately to block any concurrent calls
          hasSubmittedRef.current = true;

          const cleanedContent = removeCompletionMarker(content);
          setState((prev) => ({
            ...prev,
            isComplete: true,
            report: cleanedContent,
          }));

          submitAssessment(messages, cleanedContent);
        }
      }
    },
    [submitAssessment]
  );

  /**
   * Handles message submission with timeout management
   */
  const handleSendMessage = useCallback(
    async (text: string, sendMessage: SendMessageFn) => {
      setState((prev) => ({ ...prev, submissionError: '', isSubmitting: true }));

      // Set timeout for stuck requests
      timeoutRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          submissionError: 'Request is taking longer than expected. Please try again.',
          isSubmitting: false,
        }));
      }, REQUEST_TIMEOUT_MS);

      try {
        await sendMessage({ text });
      } catch (error) {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // Always reset isSubmitting after message is sent (stream started)
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    []
  );

  /**
   * Resets assessment state for a new assessment
   */
  const reset = useCallback(() => {
    setState({
      isComplete: false,
      report: '',
      submissionError: '',
      isSubmitting: false,
    });
    hasSubmittedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Clears submission error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, submissionError: '' }));
  }, []);

  return [
    state,
    {
      checkCompletion,
      handleSendMessage,
      reset,
      clearError,
    },
  ];
}
