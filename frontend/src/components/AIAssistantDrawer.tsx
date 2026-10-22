import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Terminal,
  CheckCircle,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AIMessage } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AIMessage[];
  onSendMessage: (commandText: string) => void;
  isProcessing: boolean;
}

const SUGGESTED_COMMANDS = [
  'Delete page 3.',
  'Rotate page 1 clockwise.',
  'Add Approved to the top-right corner of page 1.',
  'Highlight all occurrences of "confidential".',
  'Add this signature to page 2.',
  'Whiteout header on page 1.',
  'Remove the last page and export the PDF.',
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isProcessing,
}) => {
  const [inputText, setInputText] = useState('');
  const [openLogId, setOpenLogId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <aside className="w-80 sm:w-96 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 z-20 shadow-xl select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">
              Aryan AI Assistant
            </h3>
            <p className="text-[10px] text-purple-700">Autonomous Precision PDF Tools</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200/60 rounded-lg text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Commands */}
      <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          <span>Quick Commands</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_COMMANDS.slice(0, 4).map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(cmd)}
              disabled={isProcessing}
              className="text-[11px] bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 text-gray-700 px-2 py-1 rounded-md transition-all text-left truncate max-w-full disabled:opacity-50"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                  isUser
                    ? 'bg-purple-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-gray-100 text-gray-800 rounded-bl-xs border border-gray-200/60'
                }`}
              >
                {msg.text}
              </div>

              {/* Execution Log Accordion for Assistant */}
              {!isUser && msg.execution_log && msg.execution_log.length > 0 && (
                <div className="mt-1 max-w-[90%] text-[10px]">
                  <button
                    onClick={() =>
                      setOpenLogId(openLogId === msg.id ? null : msg.id)
                    }
                    className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Tool Execution Log ({msg.execution_log.length})</span>
                    {openLogId === msg.id ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {openLogId === msg.id && (
                    <div className="mt-1 bg-gray-900 text-emerald-400 font-mono p-2 rounded-lg text-[9px] space-y-0.5 max-h-36 overflow-y-auto">
                      {msg.execution_log.map((logItem, lIdx) => (
                        <div key={lIdx}>&gt; {logItem}</div>
                      ))}
                      {msg.verification && (
                        <div className="text-blue-300 border-t border-gray-800 pt-1 mt-1">
                          ✔ Verification: {msg.verification.page_count} pages,{' '}
                          {msg.verification.elements_count} delta elements
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2.5 rounded-xl border border-purple-100 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>AI agent inspecting document & executing tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-1.5 border border-gray-300 focus-within:border-purple-500 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type command (e.g. 'Delete page 2')..."
            className="flex-1 text-xs outline-hidden bg-transparent text-gray-800"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
