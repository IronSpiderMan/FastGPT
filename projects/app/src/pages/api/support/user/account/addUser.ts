import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
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
    console.log('add user...', username, password);
    // if (!username || !password) {
    //   throw new Error('缺少参数');
    // }
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
    console.log('===========创建用户================');
    console.log(user);
    //       await MongoTeamMember.create(
    // [
    //   {
    //     teamId: insertedId,
    //     userId,
    //     name: 'Owner',
    //     role: TeamMemberRoleEnum.owner,
    //     status: TeamMemberStatusEnum.active,
    //     createTime: new Date(),
    //     defaultTeam: true
    //   }
    // ],
    // { session }
    await MongoTeamMember.create({
      teamId: '65ee937be73242bdc4a05982',
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
