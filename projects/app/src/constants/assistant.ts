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
  field: '光刻区',
  updateTime: Date.now()
};
