'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, any>;
  state: 'call' | 'partial-call' | 'result';
  result?: any;
}

const TOOL_LABELS: Record<string, string> = {
  getTraffic: '查询实时路况',
  getWeather: '查询城市天气',
};

export function ToolCallCard({ toolName, args, state, result }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isRunning = state === 'call' || state === 'partial-call';
  const isSuccess = state === 'result' && result && !result.error;
  const isError = state === 'result' && result?.error;

  return (
    <div className="border rounded-lg my-2 bg-blue-50 border-blue-200 overflow-hidden">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-blue-100"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

        {isRunning && <Loader2 className="animate-spin text-blue-500" size={16} />}
        {isSuccess && <CheckCircle className="text-green-500" size={16} />}
        {isError && <XCircle className="text-red-500" size={16} />}

        <span className="font-medium text-sm">
          {TOOL_LABELS[toolName] || toolName}
        </span>
        {Object.keys(args).length > 0 && (
        <span className="text-xs text-gray-500 truncate max-w-[200px]">
            {Object.values(args).join(' → ')}
        </span>
        )}

        <span className="text-xs text-gray-500 ml-auto">
          {isRunning ? '执行中...' : isSuccess ? '已完成' : '失败'}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-blue-200 p-3 space-y-2 text-xs bg-white">
          <div>
            <div className="text-gray-500 mb-1">调用参数：</div>
            <pre className="bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="text-gray-500 mb-1">
                {isError ? '错误信息：' : '返回结果：'}
              </div>
              <pre className="bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}