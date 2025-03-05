import type { ModuleDispatchProps, ModuleDispatchResponse } from '@fastgpt/global/core/module/type';
import type { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@fastgpt/global/core/module/constants';
import type { ChatItemType } from '@fastgpt/global/core/chat/type';
import { ChatRoleEnum } from '@fastgpt/global/core/chat/constants';
import { responseWrite } from '@fastgpt/service/common/response';
import { sseResponseEventEnum } from '@fastgpt/service/common/response/constant';
import { textAdaptGptResponse } from '@/utils/adapt';
import { connectToDatabase } from '@/service/mongo';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { DatasetModeEnum } from '@fastgpt/global/support/permission/constant';

export type ChatProps = ModuleDispatchProps<{
  [ModuleInputKeyEnum.userChatInput]: string;
  [ModuleInputKeyEnum.qaMatchThreshold]: number;
  [ModuleInputKeyEnum.aiChatDatasetQuote]?: SearchDataResponseItemType[];
}>;
export type ChatResponse = ModuleDispatchResponse<{
  [ModuleOutputKeyEnum.qaIsMatched]?: boolean;
  [ModuleOutputKeyEnum.qaUnMatched]?: boolean;
  [ModuleOutputKeyEnum.answerText]: string;
}>;

/* request openai chat */
export const dispatchQaChat = async (props: ChatProps): Promise<ChatResponse> => {
  let {
    res,
    stream = false,
    detail = false,
    user,
    histories,
    module: { name, outputs },
    params: { quoteQA = [], userChatInput, qaMatchThreshold }
  } = props;

  if (!userChatInput) {
    return Promise.reject('Question is empty');
  }
  let answerText = '';
  let isMatched = false;
  if (quoteQA.length > 0) {
    if (quoteQA[0].score[0].value > qaMatchThreshold) {
      await connectToDatabase();
      const data = await MongoDatasetData.findById(quoteQA[0].id);
      const dataset = await MongoDataset.findOne({ _id: data?.datasetId });
      if (dataset?.mode === DatasetModeEnum.accurate) {
        answerText = quoteQA[0].a;
        isMatched = true;
      }
    }
  }
  if (answerText.trim() === '') {
    isMatched = false;
  }
  console.log(isMatched);

  // 组织完整聊天
  const messages: ChatItemType[] = [
    { obj: ChatRoleEnum.Human, value: userChatInput },
    { obj: ChatRoleEnum.AI, value: answerText }
  ];

  responseWrite({
    res,
    event: detail ? sseResponseEventEnum.response : undefined,
    data: textAdaptGptResponse({
      text: answerText
    })
  });
  return {
    answerText,
    isMatched: isMatched || undefined,
    unMatched: !isMatched || undefined,
    [ModuleOutputKeyEnum.responseData]: {
      totalPoints: user.openaiAccount?.key ? 0 : 0,
      model: 'qa',
      tokens: 10,
      query: `${userChatInput}`,
      maxToken: 10,
      quoteList: quoteQA,
      historyPreview: getHistoryPreview(messages),
      contextTotalLen: histories.length
    }
  };
};

function getHistoryPreview(completeMessages: ChatItemType[]) {
  return completeMessages.map((item, i) => {
    if (item.obj === ChatRoleEnum.System) return item;
    if (i >= completeMessages.length - 2) return item;
    return {
      ...item,
      value: item.value.length > 15 ? `${item.value.slice(0, 15)}...` : item.value
    };
  });
}
