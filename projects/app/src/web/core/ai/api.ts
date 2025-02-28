import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type { CreateQuestionGuideParams, RefineContentParams } from '@/global/core/ai/api.d';

export const postQuestionGuide = (data: CreateQuestionGuideParams, cancelToken: AbortController) =>
  POST<string[]>('/core/ai/agent/createQuestionGuide', data, { cancelToken });

export const postRefineContent = (data: RefineContentParams) =>
  POST<string[]>('/core/ai/agent/refineContent', data);
