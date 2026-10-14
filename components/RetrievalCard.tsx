'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export interface RetrievalItem {
  content: string;
  score: number;
  source: string;
  highlights: string[];
}

interface RetrievalCardProps {
  results: RetrievalItem[];
}

export function RetrievalCard({ results }: RetrievalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const highlight = (content: string, highlights: string[]) => {
    let result = content;
    highlights.forEach((h) => {
      result = result.replace(
        new RegExp(h, 'gi'),
        `<mark class="bg-yellow-200 px-0.5 rounded">${h}</mark>`
      );
    });
    return result;
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden mb-3">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-blue-100"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Search size={16} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          检索到 {results.length} 条相关内容
        </span>
      </div>

      {expanded && (
        <div className="border-t border-blue-200 p-3 space-y-3 bg-white">
          {results.map((item, i) => (
            <div key={i} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 w-12">相似度</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${item.score * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-blue-600 w-12 text-right">
                  {(item.score * 100).toFixed(1)}%
                </span>
              </div>

              <p
                className="text-xs text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: highlight(item.content, item.highlights),
                }}
              />

              <div className="mt-2 text-xs text-gray-400">
                来源：{item.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}