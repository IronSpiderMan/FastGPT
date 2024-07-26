import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { assistantId } = req.query as { assistantId: string };
    if (!assistantId) {
      throw new Error('参数错误');
    }
    const { role } = await authUserRole({ req, authToken: true });
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    await MongoAssistant.deleteOne({
      _id: assistantId
    });
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
