import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoAssistant } from '@fastgpt/service/core/assistant/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { assistantId } = req.query as { assistantId: string };

    if (!assistantId) {
      throw new Error('参数错误');
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
