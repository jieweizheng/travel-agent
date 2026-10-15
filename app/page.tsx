'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, Suspense } from 'react';
import { StreamingMessage } from '@/components/StreamingMessage';
import { ToolCallCard } from '@/components/ToolCallCard';
import { ThinkingCard } from '@/components/ThinkingCard';
import { MessageContent } from '@/components/MessageContent';

interface MockOption {
  name: string;
  input: string;
}

function ChatContent() {
  const [enableThinking, setEnableThinking] = useState(false);  // 默认开启
  const [mockName, setMockName] = useState<string>('off');
  const [mockList, setMockList] = useState<MockOption[]>([]);

  // 加载 mock 列表
  useEffect(() => {
    fetch('/api/mocks')
      .then((r) => r.json())
      .then((data) => setMockList(data))
      .catch(() => setMockList([]));
  }, []);

  // ✅ 切换 mock 时自动填充输入框
  const handleMockChange = (value: string) => {
    setMockName(value);
    if (value === 'off') {
      setInput('');
      return;
    }
    const selected = mockList.find((m) => m.name === value);
    if (selected) {
      setInput(selected.input);
    }
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
    api: '/api/chat',
    experimental_throttle: 50,
    body: {
      mockName: mockName === 'off' ? null : mockName,
      enableThinking
    },
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔍 调试：打印最后一条消息的结构
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    console.log('[parts]', JSON.stringify(last.parts, null, 2));
    console.log('[data]', JSON.stringify((last as any).data, null, 2));
  }, [messages]);

  return (
    <div className="flex flex-col h-dvh max-w-3xl mx-auto">
      <header className="p-4 border-b flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">出行助手</h1>

         {/* 思考模式开关 */}
        <button
          onClick={() => setEnableThinking(!enableThinking)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
            enableThinking
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-gray-50 text-gray-500 border-gray-300'
          }`}
          title={enableThinking ? '思考模式已开启' : '思考模式已关闭'}
        >
          🧠 {enableThinking ? '思考' : '不思考'}
        </button>

        {/* ✅ Mock 下拉选择 */}
        <select
          value={mockName}
          onChange={(e) => handleMockChange(e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            mockName === 'off'
              ? 'bg-gray-50 text-gray-600 border-gray-300'
              : 'bg-yellow-50 text-yellow-700 border-yellow-300'
          }`}
        >
          <option value="off">🌐 真实 API</option>
          {mockList.map((m) => (
            <option key={m.name} value={m.name}>
              🧪 {m.name}
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 mt-20 max-w-xl mx-auto px-4">
            <p className="text-lg font-medium text-gray-800 mb-2">👋 你好，我是 AI 出行助手</p>
            <p className="text-sm leading-6">
              我可以帮你规划出行思路，并查询路线和天气。需要实时信息时，我可以调用百度地图驾车路线工具，查询起终点之间的路线、预计耗时、距离和路况；也可以调用 Open-Meteo 天气工具，查询城市当前天气、气温、体感温度、湿度、降水和风速。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                '查询北京到天津的驾车路线和路况',
                '查询上海当前天气',
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-800 transition hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  {example}
                </button>
              ))}
            </div>
            {mockName !== 'off' && (
              <p className="text-sm text-gray-500 mt-3">当前为 Mock 演示模式：{mockName}</p>
            )}
          </div>
        ) : (
          messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isStreamingThis = isLoading && isLastMessage;

            return (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="max-w-[85%] w-full space-y-2">
                  {message.parts?.map((part: any, partIndex: number) => {
                    // 思考过程
                    if (part.type === 'reasoning') {
                      return (
                        <ThinkingCard
                          key={`${message.id}-r-${partIndex}`}
                          content={part.text ?? part.reasoning ?? ''}
                          isStreaming={isStreamingThis}
                        />
                      );
                    }

                    // 工具调用
                    if (part.type === 'tool-invocation') {
                      return (
                        <ToolCallCard
                          key={part.toolInvocation.toolCallId}
                          toolName={part.toolInvocation.toolName}
                          args={part.toolInvocation.args}
                          state={part.toolInvocation.state}
                          result={
                            'result' in part.toolInvocation
                              ? part.toolInvocation.result
                              : undefined
                          }
                        />
                      );
                    }

                    // 文本
                    if (part.type === 'text' && part.text) {
                      return (
                        <div
                          key={`${message.id}-t-${partIndex}`}
                          className={`rounded-lg p-3 w-fit ${
                            message.role === 'user'
                              ? 'bg-[#95ec69] text-[#17351e] ml-auto'
                              : 'bg-[#f1f2f3] text-[#1f2329] mr-auto'
                          }`}
                        >
                          <MessageContent content={part.text} />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })
        )}
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
