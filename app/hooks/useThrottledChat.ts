'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import type { Message } from 'ai';

export function useThrottledChat(options: any) {
  const { messages: rawMessages, ...rest } = useChat(options);
  const [throttledMessages, setThrottledMessages] = useState<Message[]>(rawMessages);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<Message[] | null>(null);

  useEffect(() => {
    // 每次 rawMessages 变化，先暂存到 pending
    pendingRef.current = rawMessages;

    // 如果已经有定时器在跑，等它执行完再合并
    if (timerRef.current) return;

    // 启动一个 50ms 定时器
    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        setThrottledMessages(pendingRef.current);
        pendingRef.current = null;
      }
      timerRef.current = null;
    }, 500);
  }, [rawMessages]);

  return { messages: throttledMessages, ...rest };
}