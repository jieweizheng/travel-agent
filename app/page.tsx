'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, Suspense } from 'react';
import { generateLongHistory } from '@/lib/mockData';
import { StreamingMessage } from '@/components/StreamingMessage';

function ChatContent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/chat',
    initialMessages: generateLongHistory(50),
    experimental_throttle: 50,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">滴滴 AI 出行助手</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              <StreamingMessage
                content={message.content}
                isStreaming={isLoading && index === messages.length - 1}
              />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="告诉我你要去哪里..."
          className="flex-1 border rounded-lg px-4 py-2"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            发送
          </button>
        )}
      </form>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <ChatContent />
    </Suspense>
  );
}