import type { LLMModelItemType } from '../ai/model.d';
import { AppTypeEnum } from './constants';
import { AppSchema, AppSimpleEditFormType } from './type';

export type CreateAssistantParams = {
  name?: string;
  avatar?: string;
  title?: string;
  intro: string;
  graduationSchool?: string;
  projectId?: string;
  fields?: string[];
};

export interface AssistantUpdateParams {
  name?: string;
  avatar?: string;
  intro?: string;
  graduationSchool?: string;
  title?: string;
  projectId?: string;
  fields?: string[];
}
