import { GET, POST, DELETE, PUT } from '@/web/common/api/request';
import type {
  CreateAssistantParams,
  AssistantUpdateParams
} from '@fastgpt/global/core/assistant/api';
import { AssistantDetailType, AssistantListItemType } from '@fastgpt/global/core/assistant/type';

/**
 * 获取模型列表
 */
export const getAssistants = () => GET<AssistantListItemType[]>('/core/assistant/list');

/**
 * 创建一个模型
 */
export const postCreateAssistant = (data: CreateAssistantParams) =>
  POST<string>('/core/assistant/create', data);

/**
 * 根据 ID 删除模型
 */
export const delAssistantById = (id: string) => DELETE(`/core/assistant/del?assistantId=${id}`);

/**
 * 根据 ID 获取模型
 */
export const getAssistantById = (id: string) =>
  GET<AssistantDetailType>(`/core/assistant/detail?assistantId=${id}`);

/**
 * 根据 ID 更新模型
 */
export const putAssistantById = (id: string, data: AssistantUpdateParams) =>
  PUT(`/core/assistant/update?assistantId=${id}`, data);

export const getSignature = () => GET(`/core/assistant/signature`);
