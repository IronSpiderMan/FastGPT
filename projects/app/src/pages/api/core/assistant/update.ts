import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import type { AssistantUpdateParams } from '@fastgpt/global/core/assistant/api';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

/* 获取我的模型 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { name, avatar, title, intro, projectId } = req.body as AssistantUpdateParams;
    const { assistantId } = req.query as { assistantId: string };
    if (!assistantId) {
      throw new Error('assistantId is empty');
    }
    const { role } = await authUserRole({ req, authToken: true });
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    // 更新模型
    await MongoAssistant.updateOne(
      {
        _id: assistantId
      },
      {
        name,
        title,
        avatar,
        intro,
        projectId
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