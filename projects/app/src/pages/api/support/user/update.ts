import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UpdateUserParams } from '@fastgpt/global/support/user/api';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';

/* 获取我的模型 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { _id, username, avatar, password, balance, promotionRate, status, role } =
      req.body as UpdateUserParams;
    if (!_id) {
      throw new Error('userId is empty');
    }
    const userRole = await authUserRole({ req, authToken: true });
    if (userRole.role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    const user = await MongoUser.findOne({ _id });
    if (!user) {
      throw new Error('User does not exist');
    }
    // 更新用户
    const updateData = {
      username,
      avatar,
      balance,
      promotionRate,
      status,
      ...(password && { password: hashStr(password) })
    };
    await MongoUser.updateOne(
      {
        _id: _id
      },
      updateData
    );
    // 更新team member信息
    const name = role?.charAt(0).toUpperCase() + '' + role?.slice(1);
    await MongoTeamMember.updateOne(
      { userId: _id },
      {
        role: role,
        name: name
      }
    );
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
