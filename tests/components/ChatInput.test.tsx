import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/ChatInput';

describe('ChatInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders input field and submit button', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('disables submit button when input is empty', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /send message/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has content', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    const submitButton = screen.getByRole('button', { name: /send message/i });

    await user.type(input, 'Test message');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  it('submits on Enter key press', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  it('does not submit on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    await user.type(input, 'Test message');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears input on Escape key', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...') as HTMLTextAreaElement;
    await user.type(input, 'Test message');
    expect(input.value).toBe('Test message');

    await user.keyboard('{Escape}');
    expect(input.value).toBe('');
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    await user.type(input, 'Test');

    expect(screen.getByText('4/2000')).toBeInTheDocument();
  });

  it('shows error for messages that are too long', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    const longMessage = 'a'.repeat(2001);
    
    await user.type(input, longMessage);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Message is too long/)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} disabled={true} />);

    const input = screen.getByPlaceholderText('Type your answer...');
    expect(input).toBeDisabled();
  });

  it('disables submit button when loading', () => {
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /send message/i });
    expect(submitButton).toBeDisabled();
  });

  it('clears input after successful submission', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSubmit={mockOnSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Type your answer...') as HTMLTextAreaElement;
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});