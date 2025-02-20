import { AssistantSchema } from '@fastgpt/global/core/assistant/type';

export const defaultAssistant: AssistantSchema = {
  _id: '',
  userId: '',
  teamId: '',
  tmbId: '',
  name: '',
  title: '',
  avatar: '/icon/logo.svg',
  intro: '',
  projectId: '',
  fields: [],
  graduationSchool: '',
  updateTime: Date.now()
};
