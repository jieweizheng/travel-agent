import { promises as fs } from 'fs';
import path from 'path';

const MOCK_FILE = path.join(process.cwd(), 'data/mocks.json');

export async function GET() {
  try {
    const raw = await fs.readFile(MOCK_FILE, 'utf-8');
    const mocks = JSON.parse(raw);
    // 返回 name + input，前端用来做下拉和自动填充
    return Response.json(
      mocks.map((m: any) => ({ name: m.name, input: m.input ?? '' }))
    );
  } catch (err) {
    console.error('[mocks] 读取失败:', err);
    return Response.json([]);
  }
}