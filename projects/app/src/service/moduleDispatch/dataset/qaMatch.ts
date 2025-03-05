import type { ModuleDispatchProps } from '@fastgpt/global/core/module/type';
import type { SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import { ModuleInputKeyEnum, ModuleOutputKeyEnum } from '@fastgpt/global/core/module/constants';

export type ChatProps = ModuleDispatchProps<{
  [ModuleInputKeyEnum.userChatInput]: string;
  [ModuleInputKeyEnum.qaMatchThreshold]: number;
  [ModuleInputKeyEnum.aiChatDatasetQuote]?: SearchDataResponseItemType[];
}>;
export type AnswerResponse = {
  [ModuleOutputKeyEnum.userChatInput]: string;
  [ModuleOutputKeyEnum.qaIsMatched]: boolean;
  [ModuleOutputKeyEnum.qaUnMatched]: boolean;
  [ModuleOutputKeyEnum.datasetQuoteQA]?: SearchDataResponseItemType[];
  [ModuleOutputKeyEnum.answerText]: string;
};

/* request openai chat */
export const dispatchQaMatch = async (props: ChatProps): Promise<AnswerResponse> => {
  let {
    res,
    stream = false,
    detail = false,
    user,
    histories,
    module: { name, outputs },
    params: { quoteQA = [], userChatInput, qaMatchThreshold = 0.6 }
  } = props;
  if (!userChatInput) {
    return Promise.reject('Question is empty');
  }
  for (let i = 0; i < quoteQA.length; i++) {
    console.log(quoteQA[i].score);
  }
  let answerText = '没有找到匹配的问答对';
  let isMatched = false;
  if (quoteQA.length > 0) {
    if (quoteQA[0].score[0].value > qaMatchThreshold) {
      answerText = quoteQA[0].a;
      isMatched = true;
    }
  }
  console.log(isMatched);
  console.log(!isMatched);
  return {
    [ModuleOutputKeyEnum.userChatInput]: userChatInput,
    [ModuleOutputKeyEnum.qaIsMatched]: isMatched,
    [ModuleOutputKeyEnum.qaUnMatched]: !isMatched,
    [ModuleOutputKeyEnum.datasetQuoteQA]: quoteQA,
    answerText
  };
};
