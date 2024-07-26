import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { CreateUserParams } from '@fastgpt/global/support/user/api';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {
      username,
      password,
      avatar,
      balance = 200000,
      promotionRate = 15,
      status = `${UserStatusEnum.active}`
    } = req.body as CreateUserParams;

    if (!username || !password) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const exists = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (exists) {
      throw new Error('用户已存在');
    }
    const user = await MongoUser.create({
      username: username,
      password: hashStr(password),
      avatar: avatar,
      balance: balance,
      promotionRate: promotionRate,
      status: status
    });
    const team = await MongoTeam.findOne({ name: 'My Team' });
    await MongoTeamMember.create({
      teamId: team?._id,
      userId: user?._id,
      name: 'Admin',
      role: TeamMemberRoleEnum.admin,
      status: TeamMemberStatusEnum.active,
      createTime: new Date(),
      defaultTeam: true
    });
    jsonRes(res, {
      data: user
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
