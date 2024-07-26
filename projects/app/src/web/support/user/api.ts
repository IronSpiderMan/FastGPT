import { DELETE, GET, POST, PUT } from '@/web/common/api/request';
import { hashStr } from '@fastgpt/global/common/string/tools';
import type { ResLogin } from '@/global/support/api/userRes.d';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { UserUpdateParams } from '@/types/user';
import { UserType, UserListItemType } from '@fastgpt/global/support/user/type.d';
import type {
  CreateUserParams,
  FastLoginProps,
  OauthLoginProps,
  PostLoginProps,
  UpdateUserParams
} from '@fastgpt/global/support/user/api.d';
import { GetWXLoginQRResponse } from '@fastgpt/global/support/user/login/api.d';

export const sendAuthCode = (data: {
  username: string;
  type: `${UserAuthTypeEnum}`;
  googleToken: string;
}) => POST(`/proApi/support/user/inform/sendAuthCode`, data);

export const getTokenLogin = () =>
  GET<UserType>('/support/user/account/tokenLogin', {}, { maxQuantity: 1 });
export const oauthLogin = (params: OauthLoginProps) =>
  POST<ResLogin>('/proApi/support/user/account/login/oauth', params);
export const postFastLogin = (params: FastLoginProps) =>
  POST<ResLogin>('/proApi/support/user/account/login/fastLogin', params);

export const postRegister = ({
  username,
  password,
  code,
  inviterId
}: {
  username: string;
  code: string;
  password: string;
  inviterId?: string;
}) =>
  POST<ResLogin>(`/proApi/support/user/account/register/emailAndPhone`, {
    username,
    code,
    inviterId,
    password: hashStr(password)
  });

export const postFindPassword = ({
  username,
  code,
  password
}: {
  username: string;
  code: string;
  password: string;
}) =>
  POST<ResLogin>(`/proApi/support/user/account/password/updateByCode`, {
    username,
    code,
    password: hashStr(password)
  });

export const updatePasswordByOld = ({ oldPsw, newPsw }: { oldPsw: string; newPsw: string }) =>
  POST('/support/user/account/updatePasswordByOld', {
    oldPsw: hashStr(oldPsw),
    newPsw: hashStr(newPsw)
  });

export const postLogin = ({ password, ...props }: PostLoginProps) =>
  POST<ResLogin>('/support/user/account/loginByPassword', {
    ...props,
    password: hashStr(password)
  });

export const loginOut = () => GET('/support/user/account/loginout');

export const putUserInfo = (data: UserUpdateParams) => PUT('/support/user/account/update', data);

export const getWXLoginQR = () =>
  GET<GetWXLoginQRResponse>('/proApi/support/user/account/login/wx/getQR');

export const getWXLoginResult = (code: string) =>
  GET<ResLogin>(`/proApi/support/user/account/login/wx/getResult`, { code });

export const postUser = (username: string, password: string) =>
  POST('/support/user/account/addUser', { username: username, password: password });

export const getUsers = () => GET<UserListItemType[]>('/support/user/list');

export const postCreateUser = (data: CreateUserParams) =>
  POST<string>('/support/user/create', data);

export const delUserById = (id: string) => DELETE(`/support/user/del?userId=${id}`);

export const putUser = (data: UpdateUserParams) => PUT(`/support/user/update`, data);

export const getUserById = (id: string) => PUT(`/support/user?userId=${id}`);
