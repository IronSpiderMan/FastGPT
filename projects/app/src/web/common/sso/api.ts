import { POST } from '@/web/common/api/request';
import { PCKELoginProps } from '@fastgpt/global/support/user/api';
import { ResLogin } from '@/global/support/api/userRes';

export const signinOidc = (params: PCKELoginProps) => POST<ResLogin>(`/auth/signin-oidc`, params);
