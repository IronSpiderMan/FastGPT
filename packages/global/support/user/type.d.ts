import { InformTypeEnum, UserStatusEnum } from './constant';
import { TeamItemType } from './team/type';
import { TeamMemberRoleEnum } from './team/constant';

export type UserModelSchema = {
  _id: string;
  username: string;
  password: string;
  avatar: string;
  balance: number;
  promotionRate: number;
  inviterId?: string;
  openaiKey: string;
  createTime: number;
  timezone: string;
  status: `${UserStatusEnum}`;
  lastLoginTmbId?: string;
  openaiAccount?: {
    key: string;
    baseUrl: string;
  };
};

export type UserListItemType = {
  _id: string;
  username: string;
  avatar: string;
  balance: number;
  promotionRate: number;
  status: `${UserStatusEnum}`;
  openaiAccount?: {
    key: string;
    baseUrl: string;
  };
  role: `${TeamMemberRoleEnum}`;
};

export type UserType = {
  _id: string;
  username: string;
  avatar: string;
  balance: number;
  timezone: string;
  promotionRate: UserModelSchema['promotionRate'];
  openaiAccount: UserModelSchema['openaiAccount'];
  team: TeamItemType;
  standardInfo?: standardInfoType;
};
