'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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

  const hasIncompleteMarker =
    !match && content.includes('\u2063RETRIEVAL\u2063');

  return (
    <div>
      {retrievalData && <RetrievalCard results={retrievalData} />}
      {!hasIncompleteMarker && (
        <div className="prose prose-sm max-w-none prose-p:text-current prose-headings:text-current prose-strong:text-current prose-li:text-current">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {textContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
