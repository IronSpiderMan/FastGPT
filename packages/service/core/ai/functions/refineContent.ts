import type { ChatMessageItemType } from '@fastgpt/global/core/ai/type.d';
import { getAIApi } from '../config';
import { countGptMessagesTokens } from '@fastgpt/global/common/string/tiktoken';

export const PromptRefineContent =
  global.systemPrompts?.refinePrompt ||
  `剔除用户内容中的人名、邮箱等内容。对用户内容总结，删除具有时效性的内容和非通用知识的内容，返回总结后的结果。
please think step by step.
`;

export async function refineContent({ content, model }: { content: string; model: string }) {
  const messages: ChatMessageItemType[] = [
    {
      role: 'system',
      content: PromptRefineContent
    },
    {
      role: 'user',
      content: content
    }
  ];
  console.log(messages);
  const ai = getAIApi({
    timeout: 480000
  });
  const data = await ai.chat.completions.create({
    model: model,
    temperature: 0.1,
    max_tokens: 10240,
    messages: messages,
    stream: false
  });
  const answer = data.choices?.[0]?.message?.content || '';
  const tokens = countGptMessagesTokens(messages);
  try {
    return {
      result: answer,
      tokens
    };
  } catch (error) {
    return {
      result: content,
      tokens: 0
    };
  }
}
