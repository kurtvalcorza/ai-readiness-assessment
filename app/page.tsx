'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatInput } from '@/components/ChatInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';
import { ConsentBanner } from '@/components/ConsentBanner';
import { ChatMessageList } from '@/components/ChatMessageList';
import { UIMessage } from '@/lib/types';
import { useConsent } from '@/hooks/useConsent';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useAssessmentLogic } from '@/hooks/useAssessmentLogic';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const [consentState, consentActions] = useConsent();
  const [assessmentState, assessmentActions] = useAssessmentLogic();

  const { messages, status, sendMessage, error } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: INITIAL_MESSAGES,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Use chat scroll hook
  useChatScroll(messagesEndRef, assessmentState.isSubmitting);

  // Check for assessment completion
  useEffect(() => {
    assessmentActions.checkCompletion(messages);
  }, [messages, assessmentActions]);

  // Clear isSubmitting when streaming completes
  useEffect(() => {
    if (assessmentState.isSubmitting && status === 'ready') {
      // Streaming completed, but we keep isSubmitting true until timeout clears
      // The hook handles this internally
    }
  }, [status, assessmentState.isSubmitting]);

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = assessmentState.isSubmitting;

  /**
   * Resets the chat state for a new assessment
   */
  const handleStartNewAssessment = () => {
    assessmentActions.reset();
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
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            error={error}
            assessmentState={assessmentState}
            messagesEndRef={messagesEndRef}
            onStartNew={handleStartNewAssessment}
            onClearError={assessmentActions.clearError}
          />
        </ChatErrorBoundary>

        <footer
          className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10"
          role="contentinfo"
        >
          {assessmentState.isComplete ? (
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
                onSubmit={(text) => assessmentActions.handleSendMessage(text, sendMessage)}
                isLoading={isLoading}
                disabled={assessmentState.isComplete}
              />
            </ErrorBoundary>
          )}
        </footer>

        {/* Consent Banner */}
        {consentState.showBanner && (
          <ConsentBanner
            onAccept={consentActions.accept}
            onDecline={consentActions.decline}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
