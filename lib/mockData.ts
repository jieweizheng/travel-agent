import type { Message } from 'ai';

// 造 50 轮对话（100条消息），每条 200 字左右
export function generateLongHistory(): Message[] {
  const messages: Message[] = [];
  const longText = '这是一段很长的历史消息，用来模拟真实场景下积累的对话上下文。'.repeat(10);
  
  for (let i = 0; i < 50; i++) {
    messages.push({
      id: `user-${i}`,
      role: 'user',
      content: `第${i + 1}轮提问：${longText}`,
    });
    messages.push({
      id: `assistant-${i}`,
      role: 'assistant',
      content: `第${i + 1}轮回答：${longText}**加粗**、\`代码\`、- 列表项\n\n${longText}`,
    });
  }
  return messages;
}