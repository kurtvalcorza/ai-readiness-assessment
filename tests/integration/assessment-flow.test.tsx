import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '@/app/page';

// Mock the AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

// Mock the TextStreamChatTransport
vi.mock('ai', () => ({
  TextStreamChatTransport: vi.fn(),
}));

describe('Assessment Flow Integration', () => {
  let mockSendMessage: ReturnType<typeof vi.fn>;
  let mockMessages: any[];

  beforeEach(async () => {
    // Reset mocks
    mockSendMessage = vi.fn();
    mockMessages = [
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

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => 'accepted'), // Default to accepted to hide banner
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Mock useChat hook
    const { useChat } = await import('@ai-sdk/react');
    vi.mocked(useChat).mockReturnValue({
      messages: mockMessages,
      status: 'ready',
      sendMessage: mockSendMessage,
      error: undefined,
      input: '',
      setInput: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      stop: vi.fn(),
      reload: vi.fn(),
      append: vi.fn(),
      setMessages: vi.fn(),
      data: undefined,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render initial welcome message', () => {
    render(<Chat />);

    expect(screen.getByText(/Hi! I'm here to help assess/)).toBeInTheDocument();
    expect(screen.getByText(/What agency or organization do you work for?/)).toBeInTheDocument();
  });

  it('should allow user to submit organization name', async () => {
    const user = userEvent.setup();
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type your answer...');
    const submitButton = screen.getByRole('button', { name: /send message/i });

    await user.type(input, 'Test Organization');
    await user.click(submitButton);

    expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Test Organization' });
  });

  it('should display error message when chat fails', async () => {
    const testError = new Error('Network error');
    
    const { useChat } = await import('@ai-sdk/react');
    vi.mocked(useChat).mockReturnValue({
      messages: mockMessages,
      status: 'ready',
      sendMessage: mockSendMessage,
      error: testError,
      input: '',
      setInput: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: false,
      stop: vi.fn(),
      reload: vi.fn(),
      append: vi.fn(),
      setMessages: vi.fn(),
      data: undefined,
    } as any);

    render(<Chat />);

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  // Note: More detailed component behavior tests (assessment completion, download options, etc.)
  // are covered in component-specific tests. Integration tests focus on the overall flow.
});
