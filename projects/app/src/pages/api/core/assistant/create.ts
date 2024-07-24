import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateAssistantParams } from '@fastgpt/global/core/assistant/api';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import { authUserNotVisitor } from '@fastgpt/service/support/permission/auth/user';
import { checkTeamAppLimit } from '@fastgpt/service/support/permission/teamLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { name = 'APP', avatar, title, intro, projectId } = req.body as CreateAssistantParams;

    if (!name) {
      throw new Error('缺少参数');
    }

    // 凭证校验
    const { teamId, tmbId } = await authUserNotVisitor({ req, authToken: true });

    // 上限校验
    await checkTeamAppLimit(teamId);

    // 创建模型
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
