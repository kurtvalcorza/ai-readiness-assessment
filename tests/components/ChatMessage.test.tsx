import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '@/components/ChatMessage';
import { UIMessage } from '@/lib/types';

describe('ChatMessage', () => {
  const createMockMessage = (role: 'user' | 'assistant', text: string): UIMessage => ({
    id: '1',
    role,
    parts: [{ type: 'text', text }],
  });

  describe('User messages', () => {
    it('renders user message with correct styling', () => {
      const message = createMockMessage('user', 'Hello, this is a user message');
      render(<ChatMessage message={message} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('flex-row-reverse');
      expect(screen.getByText('Hello, this is a user message')).toBeInTheDocument();
    });

    it('displays user icon for user messages', () => {
      const message = createMockMessage('user', 'Test message');
      const { container } = render(<ChatMessage message={message} />);

      // User icon container should have gray background
      const iconContainer = container.querySelector('.bg-gray-800');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has correct aria-label for user messages', () => {
      const message = createMockMessage('user', 'Test message');
      render(<ChatMessage message={message} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Your message');
    });
  });

  describe('Assistant messages', () => {
    it('renders assistant message with correct styling', () => {
      const message = createMockMessage('assistant', 'Hello, this is an assistant message');
      render(<ChatMessage message={message} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('flex-row');
      expect(screen.getByText('Hello, this is an assistant message')).toBeInTheDocument();
    });

    it('displays bot icon for assistant messages', () => {
      const message = createMockMessage('assistant', 'Test message');
      const { container } = render(<ChatMessage message={message} />);

      // Bot icon container should have blue background
      const iconContainer = container.querySelector('.bg-blue-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has correct aria-label for assistant messages', () => {
      const message = createMockMessage('assistant', 'Test message');
      render(<ChatMessage message={message} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Assistant message');
    });
  });

  describe('Markdown rendering', () => {
    it('renders markdown headings', () => {
      const message = createMockMessage('assistant', '# Heading 1\n## Heading 2');
      render(<ChatMessage message={message} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading 2');
    });

    it('renders markdown lists', () => {
      const message = createMockMessage('assistant', '- Item 1\n- Item 2\n- Item 3');
      render(<ChatMessage message={message} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toHaveTextContent('Item 1');
      expect(listItems[1]).toHaveTextContent('Item 2');
      expect(listItems[2]).toHaveTextContent('Item 3');
    });

    it('renders markdown bold text', () => {
      const message = createMockMessage('assistant', 'This is **bold text**');
      const { container } = render(<ChatMessage message={message} />);

      const boldElement = container.querySelector('strong');
      expect(boldElement).toBeInTheDocument();
      expect(boldElement).toHaveTextContent('bold text');
    });

    it('renders markdown links', () => {
      const message = createMockMessage('assistant', '[Click here](https://example.com)');
      render(<ChatMessage message={message} />);

      const link = screen.getByRole('link', { name: 'Click here' });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders markdown code blocks', () => {
      const message = createMockMessage('assistant', '```javascript\nconst x = 1;\n```');
      const { container } = render(<ChatMessage message={message} />);

      const codeBlock = container.querySelector('code');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveTextContent('const x = 1;');
    });
  });

  describe('Completion marker removal', () => {
    it('removes assessment complete marker from message content', () => {
      const message = createMockMessage(
        'assistant',
        'Assessment complete ###ASSESSMENT_COMPLETE### Thank you!'
      );
      render(<ChatMessage message={message} />);

      expect(screen.getByText(/Assessment complete/)).toBeInTheDocument();
      expect(screen.getByText(/Thank you!/)).toBeInTheDocument();
      expect(screen.queryByText('###ASSESSMENT_COMPLETE###')).not.toBeInTheDocument();
    });

    it('handles messages without completion marker', () => {
      const message = createMockMessage('assistant', 'Regular message without marker');
      render(<ChatMessage message={message} />);

      expect(screen.getByText('Regular message without marker')).toBeInTheDocument();
    });

    it('removes first completion marker (replace behavior)', () => {
      const message = createMockMessage(
        'assistant',
        '###ASSESSMENT_COMPLETE### This is the content'
      );
      render(<ChatMessage message={message} />);

      expect(screen.queryByText('###ASSESSMENT_COMPLETE###')).not.toBeInTheDocument();
      expect(screen.getByText(/This is the content/)).toBeInTheDocument();
    });
  });

  describe('Multiple message parts', () => {
    it('combines multiple text parts into single content', () => {
      const message: UIMessage = {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'First part. ' },
          { type: 'text', text: 'Second part. ' },
          { type: 'text', text: 'Third part.' },
        ],
      };
      render(<ChatMessage message={message} />);

      expect(screen.getByText(/First part\. Second part\. Third part\./)).toBeInTheDocument();
    });

    it('filters out non-text parts', () => {
      const message: UIMessage = {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Text content' },
          { type: 'file' as any, data: 'file data' }, // Non-text part
        ],
      };
      render(<ChatMessage message={message} />);

      expect(screen.getByText('Text content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      const message = createMockMessage('user', 'Test message');
      render(<ChatMessage message={message} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('hides decorative icon from screen readers', () => {
      const message = createMockMessage('user', 'Test message');
      const { container } = render(<ChatMessage message={message} />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
