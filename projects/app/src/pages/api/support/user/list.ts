import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import { UserListItemType } from '@fastgpt/global/support/user/type';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { role } = await authUserRole({ req, authToken: true });
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    const users = await MongoUser.aggregate([
      {
        $lookup: {
          from: MongoTeamMember.collection.name,
          localField: '_id',
          foreignField: 'userId',
          as: 'teamMember'
        }
      },
      {
        $unwind: {
          path: '$teamMember',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          avatar: 1,
          balance: 1,
          promotionRate: 1,
          status: 1,
          role: '$teamMember.role'
        }
      }
    ]);
    jsonRes<UserListItemType[]>(res, {
      data: users.map((user) => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        promotionRate: user.promotionRate,
        status: user.status,
        openaiAccount: user.openaiAccount,
        role: user.role
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
