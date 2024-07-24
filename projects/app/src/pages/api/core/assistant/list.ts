import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';
import { mongoRPermission } from '@fastgpt/global/support/permission/utils';
import { AssistantListItemType } from '@fastgpt/global/core/assistant/type';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // 凭证校验
    const { teamId, tmbId, teamOwner, role } = await authUserRole({ req, authToken: true });

    // 根据 userId 获取模型信息
    const assistants = await MongoAssistant.find(
      { ...mongoRPermission({ teamId, tmbId, role }) },
      '_id avatar name intro tmbId permission'
    ).sort({
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
