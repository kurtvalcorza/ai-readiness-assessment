'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { AssessmentComplete } from '@/components/AssessmentComplete';
import { ErrorAlert } from '@/components/ErrorAlert';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';
import { UIMessage, AssessmentData } from '@/lib/types';
import { sanitizeConversationHistory } from '@/lib/validation';
import { debounce, smoothScrollToElement } from '@/lib/utils';
import {
  parseAssessmentReport,
  isAssessmentComplete,
  removeCompletionMarker,
} from '@/lib/report-parser';

/**
 * Initial welcome message for the chat
 */
const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: `Hi! I'm here to help assess your organization's AI readiness.

This takes about 5-10 minutes. I'll ask about your work, challenges, and interests—then suggest AI solutions that might help.

**Ready? Let's start.**

What agency or organization do you work for?`,
      },
    ],
  },
];

/**
 * Main chat component for AI readiness assessment
 */
export default function Chat() {
  const [mounted, setMounted] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [loadingState, setLoadingState] = useState<'idle' | 'connecting' | 'streaming' | 'error'>('idle');
  const [requestTimeout, setRequestTimeout] = useState<NodeJS.Timeout | null>(null);
  const hasSubmittedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, status, sendMessage, error } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: INITIAL_MESSAGES,
    onError: (error) => {
      console.error('Chat error:', error);
      setLoadingState('error');
      if (requestTimeout) {
        clearTimeout(requestTimeout);
        setRequestTimeout(null);
      }
    },
  });

  /**
   * Effect to manage loading states based on useChat status
   */
  useEffect(() => {
    if (status === 'submitted') {
      setLoadingState('connecting');
      // Set timeout for stuck requests
      const timeoutId = setTimeout(() => {
        setSubmissionError('Request is taking longer than expected. Please try again.');
        setLoadingState('error');
      }, 30000); // 30 second timeout
      setRequestTimeout(timeoutId);
    } else if (status === 'streaming') {
      setLoadingState('streaming');
      if (requestTimeout) {
        clearTimeout(requestTimeout);
        setRequestTimeout(null);
      }
    } else if (status === 'idle') {
      setLoadingState('idle');
      if (requestTimeout) {
        clearTimeout(requestTimeout);
        setRequestTimeout(null);
      }
    }
    
    // Cleanup function
    return () => {
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }
    };
  }, [status]);

  const isLoading = loadingState === 'connecting' || loadingState === 'streaming';

  /**
   * Scrolls to the bottom of the chat
   */
  const scrollToBottom = useCallback(() => {
    smoothScrollToElement(messagesEndRef.current, 'smooth');
  }, []);

  /**
   * Debounced scroll for streaming updates
   */
  const debouncedScroll = useCallback(
    debounce(scrollToBottom, 100),
    [scrollToBottom]
  );

  /**
   * Submits assessment data to the backend
   */
  const submitAssessment = async (
    conversationMessages: UIMessage[],
    report: string
  ): Promise<void> => {
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
      setSubmissionError(
        `Warning: ${errorMessage}. Your assessment is still complete and can be downloaded below.`
      );
    }
  };

  /**
   * Handles scrolling based on loading state
   */
  useEffect(() => {
    if (loadingState === 'streaming') {
      debouncedScroll();
    } else {
      scrollToBottom();
    }
  }, [messages, loadingState, scrollToBottom, debouncedScroll]);

  /**
   * Checks for assessment completion and triggers submission
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const content = lastMessage.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');

      if (isAssessmentComplete(content) && !hasSubmittedRef.current) {
        const cleanedContent = removeCompletionMarker(content);
        setAssessmentComplete(true);
        setAssessmentReport(cleanedContent);

        // Submit to backend (only once)
        hasSubmittedRef.current = true;
        submitAssessment(messages, cleanedContent);
      }
    }
  }, [messages]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }
    };
  }, [requestTimeout]);

  /**
   * Handles message submission from chat input
   */
  const handleSendMessage = async (text: string) => {
    setSubmissionError(''); // Clear any previous errors
    await sendMessage({ text });
  };

  /**
   * Resets the chat state for a new assessment
   */
  const handleStartNewAssessment = () => {
    setAssessmentComplete(false);
    setAssessmentReport('');
    setSubmissionError('');
    setLoadingState('idle');
    hasSubmittedRef.current = false;
    if (requestTimeout) {
      clearTimeout(requestTimeout);
      setRequestTimeout(null);
    }
    // Reload to get fresh state
    window.location.reload();
  };

  // Don't render until mounted (prevents hydration issues)
  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
        <ChatHeader />

        <ChatErrorBoundary onReset={handleStartNewAssessment}>
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full"
            role="main"
            aria-label="Chat conversation"
          >
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}

            {isLoading && (
              <LoadingIndicator 
                state={loadingState === 'connecting' ? 'connecting' : 'streaming'} 
              />
            )}

            {error && <ErrorAlert message={`Error: ${error.message}`} severity="error" />}

            {submissionError && (
              <ErrorAlert
                message={submissionError}
                severity="warning"
                onClose={() => setSubmissionError('')}
              />
            )}

            {assessmentComplete && (
              <ErrorBoundary
                fallback={
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800">
                      Error loading assessment completion. Please refresh the page.
                    </p>
                  </div>
                }
              >
                <AssessmentComplete
                  report={assessmentReport}
                  onStartNew={handleStartNewAssessment}
                />
              </ErrorBoundary>
            )}

            <div ref={messagesEndRef} />
          </main>
        </ChatErrorBoundary>

        <footer
          className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10"
          role="contentinfo"
        >
          {assessmentComplete ? (
            <div className="max-w-3xl mx-auto text-center p-4 bg-gray-100 rounded-xl">
              <p className="text-gray-600 font-medium">
                Assessment is complete. Please download your report or start a new assessment above.
              </p>
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <div className="max-w-3xl mx-auto text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600">
                    Chat input error. Please refresh the page to continue.
                  </p>
                </div>
              }
            >
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                disabled={assessmentComplete}
              />
            </ErrorBoundary>
          )}
        </footer>
      </div>
    </ErrorBoundary>
  );
}
