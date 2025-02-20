export interface AssistantSchema {
  _id: string;
  userId: string;
  teamId: string;
  tmbId: string;
  name: string;
  title: string;
  avatar: string;
  intro: string;
  graduationSchool: string;
  updateTime: number;
  projectId: string;
  fields: string[];
}

export type AssistantListItemType = {
  _id: string;
  name: string;
  avatar: string;
  intro: string;
  graduationSchool?: string;
  title: string;
  fields?: string[];
};

export type AssistantDetailType = AssistantSchema;
