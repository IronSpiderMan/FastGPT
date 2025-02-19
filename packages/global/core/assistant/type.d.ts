export interface AssistantSchema {
  _id: string;
  userId: string;
  teamId: string;
  tmbId: string;
  name: string;
  title: string;
  avatar: string;
  intro: string;
  updateTime: number;
  projectId: string;
  field: string;
}

export type AssistantListItemType = {
  _id: string;
  name: string;
  avatar: string;
  intro: string;
  title: string;
  field?: string;
};

export type AssistantDetailType = AssistantSchema;
