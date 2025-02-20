import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authApp } from '@fastgpt/service/support/permission/auth/app';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';

/* 获取我的模型 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { appId } = req.query as { appId: string };

    if (!appId) {
      throw new Error('参数错误');
    }

    // 凭证校验
    const { app } = await authApp({ req, authToken: true, appId, per: 'w' });
    //  // 调试日志
    // console.log('API Response - App Data:', {
    //   id: app._id,
    //   assistantId: app.assistantId,
    // });
    const assistant = await MongoAssistant.findById(app.assistantId);
    const responseData = {
      ...app, // Ensure app is converted to a plain object if it's a Mongoose document
      assistant: assistant
    };
    jsonRes(res, {
      data: responseData
    });
    // jsonRes(res, {
    //   data: app
    // });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
