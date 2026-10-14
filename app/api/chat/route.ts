import { streamText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

const MOCK_FILE = path.join(process.cwd(), 'data/mocks.json');

interface MockItem {
  name: string;
  text: string;
  reasoning?: string;
}

async function loadMocks(): Promise<MockItem[]> {
  try {
    const raw = await fs.readFile(MOCK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 构造阿里云格式的 SSE（AI SDK 会解析 reasoning_content 和 content）
function buildMockSSE(item: MockItem): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (delta: Record<string, string>) => {
        const chunk = {
          id: 'chatcmpl-mock',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'qwen-plus',
          choices: [{ index: 0, delta, finish_reason: null }],
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      };

      // 逐字发送 reasoning
      if (item.reasoning) {
        for (const char of item.reasoning) {
          send({ reasoning_content: char });
          await new Promise((r) => setTimeout(r, 15));
        }
      }

      // 逐字发送 content
      for (const char of item.text) {
        send({ content: char });
        await new Promise((r) => setTimeout(r, 25));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function createAliyunProvider(mockItem: MockItem | null) {
  return createOpenAICompatible({
    name: 'aliyun',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL!,
    fetch: async (url, options) => {
      // 有 mock 就用 mock
      if (mockItem) {
        console.log(`[Mock] 回放: ${mockItem.name}`);
        return buildMockSSE(mockItem);
      }

      // 真实请求：注入 thinking 参数
      if (options?.body) {
        const body = JSON.parse(options.body as string);
        body.enable_thinking = true;
        body.incremental_output = true;
        options.body = JSON.stringify(body);
      }
      return fetch(url, options);
    },
  });
}

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, mockName } = await req.json();
  console.log(`[Request] mockName = ${mockName ?? '(真实API)'}`);

  // 根据前端传来的 mockName 查找对应 mock
  let mockItem: MockItem | null = null;
  if (mockName) {
    const mocks = await loadMocks();
    mockItem = mocks.find((m) => m.name === mockName) ?? null;
    if (!mockItem) {
      console.warn(`[Mock] 未找到 mock: ${mockName}`);
    }
  }

  const aliyun = createAliyunProvider(mockItem);

  const result = await streamText({
    model: aliyun('qwen-plus'),
    system: '你是一个智能出行助手。请详细推导各种可能的出行方案。',
    messages,
    tools: {
      getTraffic: tool({
        description: '查询两个地点之间的实时路况',
        parameters: z.object({
          from: z.string().describe('出发地'),
          to: z.string().describe('目的地'),
        }),
        execute: async ({ from, to }) => {
          await new Promise((r) => setTimeout(r, 800));
          return { from, to, congestion: 'moderate', estimatedTime: 25, distance: '12km' };
        },
      }),
      getWeather: tool({
        description: '查询某个城市的天气',
        parameters: z.object({ city: z.string().describe('城市名') }),
        execute: async ({ city }) => {
          await new Promise((r) => setTimeout(r, 500));
          return { city, weather: '晴', temperature: 22 };
        },
      }),
    },
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}