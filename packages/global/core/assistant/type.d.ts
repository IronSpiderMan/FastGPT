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
}

export type AssistantListItemType = {
  _id: string;
  name: string;
  avatar: string;
  intro: string;
  title: string;
};

export type AssistantDetailType = AssistantSchema;
