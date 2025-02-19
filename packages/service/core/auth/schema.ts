import { model, Model, models, Schema } from 'mongoose';

import type { UserAuthSchema as UserAuthType } from '@fastgpt/global/core/userAuth/type';

export const userAuthCollectionName = 'userAuths';

const UserAuthSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  provider: {
    type: String,
    required: true
  }
});

export const MongoUserAuth: Model<UserAuthType> =
  models[userAuthCollectionName] || model(userAuthCollectionName, UserAuthSchema);
