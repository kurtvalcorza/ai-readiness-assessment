/**
 * ChatMessageList Component
 * 
 * Renders the list of chat messages with loading indicators, error alerts,
 * and assessment completion state. Extracted from the main Chat component
 * to improve maintainability and testability.
 * 
 * @example
 * ```tsx
 * <ChatMessageList
 *   messages={messages}
 *   isLoading={isLoading}
 *   error={error}
 *   assessmentState={assessmentState}
 *   messagesEndRef={messagesEndRef}
 *   onStartNew={handleStartNewAssessment}
 *   onClearError={assessmentActions.clearError}
 * />
 * ```
 */

import { RefObject } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorAlert } from '@/components/ErrorAlert';
import { AssessmentComplete } from '@/components/AssessmentComplete';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UIMessage } from '@/lib/types';
import { AssessmentState } from '@/hooks/useAssessmentLogic';

/**
 * Props for ChatMessageList component
 */
export interface ChatMessageListProps {
  /** Array of chat messages to display */
  messages: UIMessage[];
  /** Whether a message is currently being submitted */
  isLoading: boolean;
  /** Error from the chat SDK */
  error?: Error;
  /** Assessment state including completion and submission status */
  assessmentState: AssessmentState;
  /** Ref to the element at the end of messages for scrolling */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** Callback to start a new assessment */
  onStartNew: () => void;
  /** Callback to clear submission error */
  onClearError: () => void;
}

/**
 * Renders the chat message list with all associated UI states
 */
export function ChatMessageList({
  messages,
  isLoading,
  error,
  assessmentState,
  messagesEndRef,
  onStartNew,
  onClearError,
}: ChatMessageListProps) {
  return (
    <main
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full"
      role="main"
      aria-label="Chat conversation"
    >
      {/* Render all messages */}
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}

      {/* Loading indicator during message submission */}
      {isLoading && <LoadingIndicator />}

      {/* Chat SDK error */}
      {error && <ErrorAlert message={`Error: ${error.message}`} severity="error" />}

      {/* Submission error from assessment logic */}
      {assessmentState.submissionError && (
        <ErrorAlert
          message={assessmentState.submissionError}
          severity="warning"
          onClose={onClearError}
        />
      )}

      {/* Assessment completion UI */}
      {assessmentState.isComplete && (
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
            report={assessmentState.report}
            onStartNew={onStartNew}
          />
        </ErrorBoundary>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </main>
  );
}
