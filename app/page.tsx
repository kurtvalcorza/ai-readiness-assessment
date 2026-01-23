'use client';

import { useChat, UIMessage } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Send, Bot, User, Download, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Security constants
const MAX_INPUT_LENGTH = 2000; // Maximum characters per message
const MAX_CONVERSATION_HISTORY_SIZE = 50000; // Maximum size for conversation history in bytes

export default function Chat() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState('');
  const [inputError, setInputError] = useState('');

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

    // Prevent submission if assessment is complete
    if (assessmentComplete) {
      setInputError('Assessment is complete. Please download your report or start a new assessment.');
      return;
    }

    // Validate input
    if (!input.trim()) return;

    // Check input length
    if (input.length > MAX_INPUT_LENGTH) {
      setInputError(`Message is too long. Please limit your response to ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    // Basic content validation - prevent extremely repetitive content (potential attack)
    const uniqueChars = new Set(input.toLowerCase().replace(/\s/g, '')).size;
    if (uniqueChars < 5 && input.length > 100) {
      setInputError('Invalid input detected. Please provide a meaningful response.');
      return;
    }

    setInputError('');
    const value = input;
    setInput('');
    await sendMessage({ text: value });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSubmittedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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

      if (content.includes('###ASSESSMENT_COMPLETE###') && !hasSubmittedRef.current) {
        setAssessmentComplete(true);
        // Remove the marker from display
        const cleanedContent = content.replace('###ASSESSMENT_COMPLETE###', '').trim();
        setAssessmentReport(cleanedContent);

        // Submit to Google Sheets (only once)
        hasSubmittedRef.current = true;
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

      // Extract solutions from text format
      const solutions: Array<{
        priority: string;
        group: string;
        category: string;
        fit: string;
        rationale: string;
      }> = [];

      // Match solutions in the new text format: #### Priority - Category
      const solutionPattern = /####\s+(\w+)\s+-\s+(.+?)\n\*\*Group:\*\*\s+(.+?)\n\*\*Fit:\*\*\s+(.+?)\n\*\*Rationale:\*\*\s+(.+?)(?=\n####|\n###|\n---|\n\*\*|$)/gs;
      let match;
      while ((match = solutionPattern.exec(report)) !== null) {
        solutions.push({
          priority: match[1].trim(),
          group: match[3].trim(),
          category: match[2].trim(),
          fit: match[4].trim(),
          rationale: match[5].trim()
        });
      }

      // Extract next steps from numbered list
      const nextSteps: string[] = [];
      const nextStepsMatch = report.match(/\*\*Recommended Next Steps:\*\*\s*\n((?:\d+\.\s+.+\n?)+)/);
      if (nextStepsMatch) {
        const steps = nextStepsMatch[1].split('\n').filter(line => line.trim());
        steps.forEach(step => {
          const stepMatch = step.match(/^\d+\.\s+(.+)$/);
          if (stepMatch) {
            nextSteps.push(stepMatch[1].trim());
          }
        });
      }

      // Sanitize conversation history - remove potentially sensitive data and limit size
      const sanitizedHistory = sanitizeConversationHistory(conversationMessages);

      const data = {
        organization: orgMatch?.[1]?.trim() || 'Unknown',
        domain: domainMatch?.[1]?.trim() || 'Unknown',
        readinessLevel: readinessMatch?.[1]?.trim() || 'Unknown',
        solutions,
        nextSteps,
        timestamp: new Date().toISOString(),
        conversationHistory: sanitizedHistory
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

  // Sanitize conversation history to prevent storing sensitive data
  const sanitizeConversationHistory = (messages: typeof initialMessages): string => {
    try {
      // Create a simplified version of conversation history
      const simplified = messages.map(msg => ({
        role: msg.role,
        content: msg.parts
          ?.filter(p => p.type === 'text')
          .map(p => {
            let text = p.text;
            // Remove potential PII patterns (basic sanitization)
            text = text.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]');
            text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
            // Truncate very long messages
            return text.length > 500 ? text.substring(0, 500) + '...[truncated]' : text;
          })
          .join('')
      }));

      const historyJson = JSON.stringify(simplified);

      // If conversation history is too large, truncate it
      if (historyJson.length > MAX_CONVERSATION_HISTORY_SIZE) {
        console.warn('Conversation history too large, truncating...');
        return historyJson.substring(0, MAX_CONVERSATION_HISTORY_SIZE) + '...[truncated]';
      }

      return historyJson;
    } catch (error) {
      console.error('Error sanitizing conversation history:', error);
      return JSON.stringify([{ role: 'system', content: 'Error sanitizing history' }]);
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

  const downloadPDF = async () => {
    try {
      // Dynamically import html2pdf.js (client-side only)
      const html2pdf = (await import('html2pdf.js')).default;

      // Convert markdown to HTML
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.color = '#000';

      // Create a temporary React root to render markdown
      const ReactMarkdown = (await import('react-markdown')).default;
      const remarkGfm = (await import('remark-gfm')).default;
      const { createRoot } = await import('react-dom/client');

      const root = createRoot(container);

      // Render and wait for it to complete
      await new Promise<void>((resolve) => {
        root.render(
          <div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {assessmentReport}
            </ReactMarkdown>
          </div>
        );
        // Give React time to render
        setTimeout(() => resolve(), 100);
      });

      // Configure PDF options
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `AI-Assessment-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      // Generate and download PDF
      await html2pdf().set(options).from(container).save();

      // Cleanup
      root.unmount();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try downloading the Markdown version instead.');
    }
  };

  const startNewAssessment = () => {
    // Reload the page to start fresh
    window.location.reload();
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
          <p className="text-xs text-gray-500">Self-Service Assessment Tool</p>
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
          <div className="space-y-4" role="region" aria-label="Assessment complete">
            <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center">
              <h2 className="text-xl font-bold text-green-800 mb-2">Assessment Complete!</h2>
              <p className="text-gray-700 mb-4">Your AI readiness assessment has been completed and saved. Download your report below.</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={downloadMarkdown}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-sm"
                  aria-label="Download assessment report as Markdown file"
                >
                  <Download size={20} aria-hidden="true" />
                  Download MD
                </button>
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-sm"
                  aria-label="Download assessment report as PDF file"
                >
                  <FileText size={20} aria-hidden="true" />
                  Download PDF
                </button>
                <button
                  onClick={startNewAssessment}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
                  aria-label="Start a new assessment"
                >
                  Start New Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10" role="contentinfo">
        {assessmentComplete ? (
          <div className="max-w-3xl mx-auto text-center p-4 bg-gray-100 rounded-xl">
            <p className="text-gray-600 font-medium">
              Assessment is complete. Please download your report or start a new assessment above.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-2">
            {inputError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
                {inputError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end" aria-label="Send message">
              <div className="flex-1 relative">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 resize-none min-h-[48px] max-h-[200px]"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInputError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                    if (e.key === 'Escape') {
                      setInput('');
                      setInputError('');
                    }
                  }}
                  placeholder="Type your answer..."
                  autoFocus
                  rows={1}
                  maxLength={MAX_INPUT_LENGTH}
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
                <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                  {input.length}/{MAX_INPUT_LENGTH}
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                disabled={isLoading || !input?.trim() || input.length > MAX_INPUT_LENGTH}
                aria-label="Send message"
              >
                <Send size={20} aria-hidden="true" />
              </button>
            </form>
          </div>
        )}
      </footer>
    </div>
  );
}
