import { connectionMongo, type Model } from '../../../common/mongo';

const { Schema, model, models } = connectionMongo;
import { DatasetDataRefineSchemaType } from '@fastgpt/global/core/dataset/type.d';

export const RefineCollectionName = 'datasets.data.refines';

const DatasetDataRefineSchema = new Schema({
  dataId: {
    type: Schema.Types.ObjectId,
    ref: 'dataset.data'
  },
  updateTime: {
    type: Date,
    default: () => new Date()
  },
  rawData: {
    type: String,
    required: true
  },
  refinedData: {
    type: String,
    required: true
  },
  agentModel: {
    type: String,
    default: 'gpt-3.5-turbo-16k'
  }
});

export const MongoRefine: Model<DatasetDataRefineSchemaType> =
  models[RefineCollectionName] || model(RefineCollectionName, DatasetDataRefineSchema);
MongoRefine.syncIndexes();
