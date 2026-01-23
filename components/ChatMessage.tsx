/**
 * Individual chat message component
 */

import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UIMessage } from '@/lib/types';
import { ASSESSMENT_COMPLETE_MARKER } from '@/lib/constants';

interface ChatMessageProps {
  message: UIMessage;
}

/**
 * Extracts text content from message parts
 */
function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('')
    .replace(ASSESSMENT_COMPLETE_MARKER, '');
}

export function ChatMessage({ message }: ChatMessageProps) {
  const content = getMessageContent(message);
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${isUser ? 'Your message' : 'Assistant message'}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${
          isUser
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm'
            : 'bg-white border border-blue-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
