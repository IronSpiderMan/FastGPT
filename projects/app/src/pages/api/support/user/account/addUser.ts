import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password } = req.body as PostLoginProps;
    if (!username || !password) {
      throw new Error('缺少参数');
    }
    // 检测用户是否存在
    const exists = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (exists) {
      throw new Error('用户已注册');
    }

    const user = await MongoUser.create({
      username,
      password
    });
    jsonRes(res, {
      data: {
        user: user
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
