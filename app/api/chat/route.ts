import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 创建自定义provider，指向阿里云百炼
const aliyun = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: aliyun('qwen-plus'),
    system: '你是一个智能出行助手，负责为用户推荐最佳出行方案。请用 Markdown 格式输出。',
    messages,
  });

  return result.toDataStreamResponse();
}