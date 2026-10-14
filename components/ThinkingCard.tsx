'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface ThinkingCardProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingCard({ content, isStreaming }: ThinkingCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50 overflow-hidden mb-2">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-purple-100"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Brain size={16} className="text-purple-600" />
        <span className="text-sm font-medium text-purple-700">
          {isStreaming ? '正在思考...' : '思考过程'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {content?.length || 0} 字
        </span>
      </div>

      {expanded && (
        <div className="border-t border-purple-200 p-3 bg-white">
          <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}