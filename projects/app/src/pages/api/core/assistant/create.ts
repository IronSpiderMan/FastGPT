import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateAssistantParams } from '@fastgpt/global/core/assistant/api';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { name = '博士', avatar, title, intro, projectId } = req.body as CreateAssistantParams;
    if (!name) {
      throw new Error('缺少参数');
    }
    const { teamId, tmbId, role } = await authUserRole({ req, authToken: true });
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    // 创建数字人
    const response = await MongoAssistant.create({
      avatar,
      name,
      title,
      intro,
      projectId,
      teamId,
      tmbId
    });

    jsonRes(res, {
      data: response._id
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
