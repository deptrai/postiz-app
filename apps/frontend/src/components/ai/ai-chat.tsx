'use client';

import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationHistory {
  id: string;
  question: string;
  answer: string;
  tokensUsed: number;
  createdAt: string;
}

interface AIChatProps {
  integrationId?: string;
}

export const AIChat: FC<AIChatProps> = ({ integrationId }) => {
  const fetch = useFetch();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSuggestedQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (integrationId) {
        params.set('integrationId', integrationId);
      }
      const response = await fetch(`/ai/suggested-questions?${params.toString()}`);
      const data = await response.json();
      setSuggestedQuestions(data.questions || []);
    } catch (e) {
      console.error('Failed to load suggested questions', e);
    }
  }, [fetch, integrationId]);

  useEffect(() => {
    loadSuggestedQuestions();
  }, [loadSuggestedQuestions]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/ai/history?limit=10');
      const data = await response.json();
      setHistory(data.conversations || []);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, [fetch]);

  const askQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/ai/ask', {
          method: 'POST',
          body: JSON.stringify({
            question,
            integrationId,
          }),
        });

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.suggestedQuestions) {
          setSuggestedQuestions(data.suggestedQuestions);
        }
      } catch (e) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetch, integrationId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    askQuestion(question);
  };

  const handleHistoryItemClick = (item: ConversationHistory) => {
    setMessages([
      {
        id: `history-user-${item.id}`,
        role: 'user',
        content: item.question,
        timestamp: new Date(item.createdAt),
      },
      {
        id: `history-assistant-${item.id}`,
        role: 'assistant',
        content: item.answer,
        timestamp: new Date(item.createdAt),
      },
    ]);
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Analytics Assistant</h3>
            <p className="text-xs text-gray-400">Ask me about your analytics</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadHistory();
          }}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
        >
          {showHistory ? 'Chat' : 'History'}
        </button>
      </div>

      {/* Messages or History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showHistory ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Conversations</h4>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No conversation history yet</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryItemClick(item)}
                  className="w-full text-left p-3 bg-gray-800 rounded-lg hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <p className="text-sm text-white line-clamp-1">{item.question}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()} • {item.tokensUsed} tokens
                  </p>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Ask me anything about your analytics</h4>
                <p className="text-sm text-gray-400 mb-6">
                  I can help you understand trends, explain changes, and provide insights
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={clsx(
                    'max-w-[80%] rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Questions */}
      {!showHistory && suggestedQuestions.length > 0 && messages.length === 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {!showHistory && (
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your analytics..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChat;
