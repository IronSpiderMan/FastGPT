import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import { AssistantListItemType } from '@fastgpt/global/core/assistant/type';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // 凭证校验
    const { role } = await authUserRole({ req, authToken: true });
    if (role !== TeamMemberRoleEnum.superAdmin) {
      throw new Error('Permission denied');
    }
    // 根据 userId 获取模型信息
    const assistants = await MongoAssistant.find().sort({
      updateTime: -1
    });
    jsonRes<AssistantListItemType[]>(res, {
      data: assistants.map((assistant) => ({
        _id: assistant._id,
        avatar: assistant.avatar,
        title: assistant.title,
        name: assistant.name,
        intro: assistant.intro
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
