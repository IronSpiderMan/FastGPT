export interface UserAuthSchema {
  _id: string;
  userId: string;
  provider: string;
}

export type UserAuthDetailType = UserAuthSchema;
