import { OAuthEnum, UserStatusEnum } from './constant';
import { TeamMemberRoleEnum } from './team/constant';

export type PostLoginProps = {
  username: string;
  password: string;
};

export type OauthLoginProps = {
  type: `${OAuthEnum}`;
  code: string;
  callbackUrl: string;
  inviterId?: string;
};

export type WxLoginProps = {
  inviterId?: string;
  code: string;
};

export type FastLoginProps = {
  token: string;
  code: string;
};

export type CreateUserParams = {
  username?: string;
  avatar?: string;
  password?: string;
  balance?: number;
  promotionRate?: number;
  openaiAccount?: {
    key: string;
    baseUrl: string;
  };
  status?: `${UserStatusEnum}`;
  role?: `${TeamMemberRoleEnum}`;
};

export type UpdateUserParams = CreateUserParams & { _id?: string };
