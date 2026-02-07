import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { ChatMessageList } from '@/components/ChatMessageList';
import { UIMessage } from '@/lib/types';
import { AssessmentState } from '@/hooks/useAssessmentLogic';

describe('ChatMessageList', () => {
  const mockOnStartNew = vi.fn();
  const mockOnClearError = vi.fn();
  const messagesEndRef = createRef<HTMLDivElement>();

  const mockMessages: UIMessage[] = [
    {
      id: '1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hello! How can I help you?' }],
    },
    {
      id: '2',
      role: 'user',
      parts: [{ type: 'text', text: 'I need help with my assessment' }],
    },
  ];

  const defaultAssessmentState: AssessmentState = {
    isComplete: false,
    report: '',
    submissionError: '',
    isSubmitting: false,
  };

  beforeEach(() => {
    mockOnStartNew.mockClear();
    mockOnClearError.mockClear();
  });

  it('renders messages correctly', () => {
    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        assessmentState={defaultAssessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    expect(screen.getByText('I need help with my assessment')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={true}
        assessmentState={defaultAssessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();
  });

  it('shows error alert when error prop is provided', () => {
    const error = new Error('Network error');
    
    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        error={error}
        assessmentState={defaultAssessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();
  });

  it('shows submission error when assessmentState has submissionError', () => {
    const assessmentState: AssessmentState = {
      ...defaultAssessmentState,
      submissionError: 'Failed to submit assessment',
    };

    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        assessmentState={assessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('Failed to submit assessment')).toBeInTheDocument();
  });

  it('shows assessment complete when isComplete is true', () => {
    const assessmentState: AssessmentState = {
      ...defaultAssessmentState,
      isComplete: true,
      report: '# Assessment Report\n\nYour organization is ready for AI.',
    };

    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        assessmentState={assessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    // AssessmentComplete component should be rendered
    expect(screen.getByText(/Assessment Complete/i)).toBeInTheDocument();
  });

  it('renders empty message list', () => {
    render(
      <ChatMessageList
        messages={[]}
        isLoading={false}
        assessmentState={defaultAssessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    // Should render the main element but no messages
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('renders multiple error states simultaneously', () => {
    const error = new Error('Chat error');
    const assessmentState: AssessmentState = {
      ...defaultAssessmentState,
      submissionError: 'Submission error',
    };

    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        error={error}
        assessmentState={assessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText('Error: Chat error')).toBeInTheDocument();
    expect(screen.getByText('Submission error')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <ChatMessageList
        messages={mockMessages}
        isLoading={false}
        assessmentState={defaultAssessmentState}
        messagesEndRef={messagesEndRef}
        onStartNew={mockOnStartNew}
        onClearError={mockOnClearError}
      />
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'Chat conversation');
  });
});
