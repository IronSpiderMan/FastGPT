import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { userId } = req.query as { userId: string };
    if (!userId) {
      throw new Error('参数错误');
    }
    const { tmbId, role } = await authUserRole({ req, authToken: true });
    console.log(role, TeamMemberRoleEnum.superAdmin);
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw Error('权限不足');
    }
    const userDetail = await getUserDetail({ tmbId });
    if (userDetail._id == userId) {
      throw Error('不能删除自己的账户');
    }
    await MongoUser.deleteOne({
      _id: userId
    });
    // 删除TeamMember
    await MongoTeamMember.deleteOne({
      userId: userId
    });
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
