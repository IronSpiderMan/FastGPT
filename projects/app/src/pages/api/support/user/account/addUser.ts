import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { connectToDatabase } from '@/service/mongo';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { hashStr } from '@fastgpt/global/common/string/tools';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password } = req.body as PostLoginProps;
    // 检测用户是否存在
    const exists = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (exists) {
      throw new Error('用户已注册');
    }
    const user = await MongoUser.create({
      username: username,
      password: hashStr(password)
    });
    const team = await MongoTeam.findOne({ name: 'My Team' });
    await MongoTeamMember.create({
      teamId: team.teamId,
      userId: user._id,
      name: 'Admin',
      role: TeamMemberRoleEnum.admin,
      status: TeamMemberStatusEnum.active,
      createTime: new Date(),
      defaultTeam: true
    });
    jsonRes(res, {
      data: {
        user: user
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
