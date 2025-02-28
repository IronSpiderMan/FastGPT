import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { RefineContentParams } from '@/global/core/ai/api.d';
import { refineContent } from '@fastgpt/service/core/ai/functions/refineContent';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { content } = req.body as RefineContentParams;
    if (!content) {
      console.log(content, 'null');
      jsonRes(res, {
        data: ''
      });
    }
    const qgModel = global.llmModels[0];
    const { result, tokens } = await refineContent({
      content,
      model: qgModel.model
    });
    jsonRes(res, {
      data: result
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
