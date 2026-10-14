'use client';

import { RetrievalCard, RetrievalItem } from './RetrievalCard';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  let retrievalData: RetrievalItem[] | null = null;
  let textContent = content;

  const match = content.match(/\u2063RETRIEVAL\u2063([\s\S]*?)\u2063/);
  if (match) {
    try {
      retrievalData = JSON.parse(match[1]);
      textContent = content.replace(match[0], '').trim();
    } catch (e) {
      console.warn('[MessageContent] 解析检索数据失败:', e);
    }
  }

  // 流式中标记不完整时，暂时不显示正文，避免闪烁
  const hasIncompleteMarker =
    !match && content.includes('\u2063RETRIEVAL\u2063');

  return (
    <div>
      {retrievalData && <RetrievalCard results={retrievalData} />}
      {!hasIncompleteMarker && (
        <div className="whitespace-pre-wrap leading-relaxed">{textContent}</div>
      )}
    </div>
  );
}