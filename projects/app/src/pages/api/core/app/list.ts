import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoRPermission } from '@fastgpt/global/support/permission/utils';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    // 凭证校验
    const { teamId, tmbId, teamOwner, role } = await authUserRole({ req, authToken: true });

    // 根据 userId 获取模型信息
    const myApps = await MongoApp.find(
      { ...mongoRPermission({ teamId, tmbId, role }) },
      '_id avatar name intro tmbId permission assistantId'
    ).sort({
      updateTime: -1
    });

    // 提取所有的 assistantId 并去重
    const assistantIds = [...new Set(myApps.map((app) => app.assistantId).filter((id) => id))];

    // 批量查询 Assistant 数据
    const assistants = await MongoAssistant.find({ _id: { $in: assistantIds } }).lean();
    // console.log('assistants',assistants)
    // 转为 Map，加速后续查找
    const assistantMap = new Map(assistants.map((assistant) => [String(assistant._id), assistant]));
    // 合并数据
    // const responseData = myApps.map((app) => ({
    //   _id: app._id,
    //   avatar: app.avatar,
    //   assistantId: app.assistantId || '',
    //   name: app.name,
    //   intro: app.intro,
    //   isOwner: teamOwner || String(app.tmbId) === tmbId,
    //   permission: app.permission,
    //   // 合并 assistant 数据，如果存在
    //   assistant: assistantMap.get(String(app.assistantId)) as AssistantListItemType,
    // }));
    const responseData = myApps.map((app) => {
      const assistant = assistantMap.get(String(app.assistantId)) || null;
      return {
        _id: app._id,
        avatar: app.avatar,
        assistantId: app.assistantId || '',
        name: app.name,
        intro: app.intro,
        isOwner: String(app.tmbId) === tmbId || teamOwner,
        permission: app.permission,
        // 合并 assistant 数据，如果存在
        assistant
      };
    });
    // 返回结果
    jsonRes<AppListItemType[]>(res, {
      data: responseData
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
