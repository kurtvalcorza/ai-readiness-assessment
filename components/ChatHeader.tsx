/**
 * Chat header component with branding
 */

import { Bot } from 'lucide-react';

export function ChatHeader() {
  return (
    <header
      className="bg-white border-b border-gray-200 p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10"
      role="banner"
    >
      <div className="bg-blue-600 p-2 rounded-lg text-white" aria-hidden="true">
        <Bot size={24} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-800">AI Readiness Assessment</h1>
        <p className="text-xs text-gray-500">Self-Service Assessment Tool</p>
      </div>
    </header>
  );
}
