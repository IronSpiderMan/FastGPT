import { MongoUser } from '@fastgpt/service/support/user/schema';

import { addLog } from '@fastgpt/service/common/system/log';

type Props = {
  username: string;
  password: string;
};

export async function saveUser({ username, password }: Props) {
  try {
    const chat = await MongoUser.findOne({
      username,
      password
    });
    console.log('===================');
    console.log(chat);
  } catch (error) {
    addLog.error(`update chat history error`, error);
  }
}
