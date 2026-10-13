'use client';

import { Streamdown } from 'streamdown';
import { memo } from 'react';

const MemoParagraph = memo(function Paragraph({ text }: { text: string }) {
  return <Streamdown>{text}</Streamdown>;
});

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  if (!isStreaming) {
    return <Streamdown>{content}</Streamdown>;
  }

  const paragraphs = content.split('\n\n');
  const lastParagraph = paragraphs.pop() || '';

  return (
    <div>
      {paragraphs.map((p, i) => (
        <MemoParagraph key={i} text={p} />
      ))}
      <Streamdown>{lastParagraph}</Streamdown>
    </div>
  );
}