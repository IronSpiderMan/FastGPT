import { connectionMongo, type Model } from '../../common/mongo';

const { Schema, model, models } = connectionMongo;
import type { AssistantSchema as AssistantType } from '@fastgpt/global/core/assistant/type';
import {
  TeamCollectionName,
  TeamMemberCollectionName
} from '@fastgpt/global/support/user/team/constant';

export const assistantCollectionName = 'assistants';

const AssistantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  tmbId: {
    type: Schema.Types.ObjectId,
    ref: TeamMemberCollectionName,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '博士'
  },
  avatar: {
    type: String,
    default: '/icon/logo.svg'
  },
  intro: {
    type: String,
    default: ''
  },
  updateTime: {
    type: Date,
    default: () => new Date()
  },
  projectId: {
    type: String,
    default: ''
  }
});

try {
  AssistantSchema.index({ updateTime: -1 });
  AssistantSchema.index({ teamId: 1 });
} catch (error) {
  console.log(error);
}

export const MongoAssistant: Model<AssistantType> =
  models[assistantCollectionName] || model(assistantCollectionName, AssistantSchema);

MongoAssistant.syncIndexes();
