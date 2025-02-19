import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import * as process from 'node:process';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { CreateUserParams } from '@fastgpt/global/support/user/api';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { createJWT, setCookie, setCookies } from '@fastgpt/service/support/permission/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';

async function getAccessToken(code: string, codeVerifier: string) {
  const formData = new URLSearchParams();
  formData.append('client_id', process.env.CLIENT_ID || '');
  formData.append('client_secret', process.env.CLIENT_SECRET || '');
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', process.env.REDIRECT_URI || 'http://localhost:8080/signin-oidc');
  formData.append('code', code);
  formData.append('code_verifier', codeVerifier);
  const response = await fetch(`https://${process.env.SSO_DOMAIN}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });
  // TODO 这里可能返回不是200
  return await response.json();
}

async function getUserInfo(accessToken: string) {
  // 获取用户信息
  const response = await fetch(`https://${process.env.SSO_DOMAIN}/connect/userinfo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  // TODO 这里可能返回不是200
  return await response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { code, state } = req.body;
    // const {access_token, id_token} = await getAccessToken(code as string, state as string);
    const tokenData = await getAccessToken(code as string, state as string);
    const { access_token, id_token } = tokenData;
    const { email, name } = await getUserInfo(access_token);
    // 判断当前用户，是否在用户表中，如果不在则创建用户
    let user = await MongoUser.findOne({
      username: email
    });
    const {
      avatar,
      balance = 200000,
      promotionRate = 15,
      status = `${UserStatusEnum.active}`
    } = req.body as CreateUserParams;
    if (!user) {
      // 创建用户
      const default_password = email.split('@')[0];
      user = await MongoUser.create({
        username: email,
        password: hashStr(hashStr(default_password)),
        avatar: avatar,
        balance: balance,
        promotionRate: promotionRate,
        status: status
      });
      const team = await MongoTeam.findOne({ name: 'My Team' });
      await MongoTeamMember.create({
        teamId: team?._id,
        userId: user?._id,
        name: name,
        role: TeamMemberRoleEnum.visitor,
        status: TeamMemberStatusEnum.active,
        createTime: new Date(),
        defaultTeam: true
      });
    }
    const userDetail = await getUserDetail({
      tmbId: user?.lastLoginTmbId,
      userId: user?._id
    });
    MongoUser.findByIdAndUpdate(user?._id, {
      lastLoginTmbId: userDetail.team.tmbId
    });
    const token = createJWT(userDetail);
    setCookies(res, {
      token,
      id_token
    });
    // setCookie(res, token)
    jsonRes(res, {
      data: {
        user: userDetail,
        token,
        id_token
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
