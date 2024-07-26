import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });
    if (!tmbId) {
      return jsonRes(res, {
        code: 401,
        error: '请登录'
      });
    }
    const response = await axios.get(
      process.env.DIGITAL_HUMAN_SIGNATURE_URL ||
        'https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen',
      {
        headers: {
          'Content-Type': 'application/json',
          'subscription-key': process.env.SUBSCRIPTION_KEY || ''
        }
      }
    );
    jsonRes(res, {
      data: {
        signature: response.data?.data
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
