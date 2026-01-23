'use client';

import { useChat, UIMessage } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Send, Bot, User, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chat() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialMessages: UIMessage[] = [
    {
      id: 'welcome',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: `Hi! I'm here to help assess your organization's AI readiness.

This takes about 5-10 minutes. I'll ask about your work, challenges, and interests—then suggest AI solutions that might help.

**Ready? Let's start.**

What agency or organization do you work for?`
        }
      ]
    }
  ];

  const { messages, status, sendMessage, error } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: initialMessages,
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput('');
    await sendMessage({ text: value });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();

    // Check if assessment is complete
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const content = lastMessage.parts
        ?.filter(p => p.type === 'text')
        .map(p => p.text)
        .join('') || '';

      if (content.includes('###ASSESSMENT_COMPLETE###')) {
        setAssessmentComplete(true);
        // Remove the marker from display
        const cleanedContent = content.replace('###ASSESSMENT_COMPLETE###', '').trim();
        setAssessmentReport(cleanedContent);

        // Submit to Google Sheets
        submitAssessment(messages, cleanedContent);
      }
    }
  }, [messages]);

  const submitAssessment = async (conversationMessages: typeof messages, report: string) => {
    try {
      // Extract data from report
      const orgMatch = report.match(/\*\*Organization:\*\*\s*(.+)/);
      const domainMatch = report.match(/\*\*Domain:\*\*\s*(.+)/);
      const readinessMatch = report.match(/\*\*Readiness Level:\*\*\s*(.+)/);

      const data = {
        organization: orgMatch?.[1]?.trim() || 'Unknown',
        domain: domainMatch?.[1]?.trim() || 'Unknown',
        readinessLevel: readinessMatch?.[1]?.trim() || 'Unknown',
        solutions: [],
        nextSteps: [],
        timestamp: new Date().toISOString(),
        conversationHistory: JSON.stringify(conversationMessages)
      };

      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([assessmentReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Assessment-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10" role="banner">
        <div className="bg-blue-600 p-2 rounded-lg text-white" aria-hidden="true">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI Readiness Assessment</h1>
          <p className="text-xs text-gray-500">DOST-ASTI • Self-Service Tool</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full" role="main" aria-label="Chat conversation">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`} role="article" aria-label={`${m.role === 'user' ? 'Your message' : 'Assistant message'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'
              }`} aria-hidden="true">
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${m.role === 'user'
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm'
              : 'bg-white border border-blue-100 text-gray-800 rounded-tl-sm'
              }`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {(m.parts
                    ? m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
                    : (m as any).content
                  ).replace('###ASSESSMENT_COMPLETE###', '')}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4" role="status" aria-live="polite" aria-label="Assistant is typing">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center" aria-hidden="true">
              <Bot size={16} />
            </div>
            <div className="p-4 bg-white border border-blue-100 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
              </div>
              <span className="sr-only">Assistant is typing</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert" aria-live="assertive">
            <span className="font-bold">Error:</span> {error.message}
          </div>
        )}

        {assessmentComplete && (
          <div className="flex justify-center gap-3 my-4" role="region" aria-label="Assessment complete">
            <button
              onClick={downloadMarkdown}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-sm"
              aria-label="Download assessment report as Markdown file"
            >
              <Download size={20} aria-hidden="true" />
              Download Report (Markdown)
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10" role="contentinfo">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 items-end" aria-label="Send message">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 resize-none min-h-[48px] max-h-[200px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
              if (e.key === 'Escape') {
                setInput('');
              }
            }}
            placeholder="Type your answer..."
            autoFocus
            rows={1}
            aria-label="Type your answer here. Press Enter to send, Shift+Enter for new line, Escape to clear"
            style={{
              height: 'auto',
              overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            disabled={isLoading || !input?.trim()}
            aria-label="Send message"
          >
            <Send size={20} aria-hidden="true" />
          </button>
        </form>
      </footer>
    </div>
  );
}
