import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  FlowNodeTypeEnum
} from '../../node/constant';
import { FlowModuleTemplateType } from '../../type.d';
import {
  ModuleInputKeyEnum,
  ModuleIOValueTypeEnum,
  ModuleOutputKeyEnum,
  ModuleTemplateTypeEnum
} from '../../constants';
import {
  Input_Template_Dataset_Quote,
  Input_Template_Switch,
  Input_Template_UserChatInput
} from '../input';
import { Output_Template_Finish, Output_Template_UserChatInput } from '../output';

export const QaMatchModule: FlowModuleTemplateType = {
  id: FlowNodeTypeEnum.qaMatchNode,
  templateType: ModuleTemplateTypeEnum.functionCall,
  flowType: FlowNodeTypeEnum.qaMatchNode,
  avatar: '/imgs/module/AI.png',
  name: 'QA匹配',
  intro: '匹配用户输入和知识库检索内容，返回精准回答',
  showStatus: true,
  inputs: [
    Input_Template_Switch,
    Input_Template_UserChatInput,
    Input_Template_Dataset_Quote,
    {
      key: ModuleInputKeyEnum.qaMatchThreshold,
      type: FlowNodeInputTypeEnum.slider,
      label: '问答相似的阈值',
      valueType: ModuleIOValueTypeEnum.number,
      max: 1,
      min: 0,
      step: 0.01,
      value: 0.6
    }
  ],
  outputs: [
    Output_Template_UserChatInput,
    {
      key: ModuleOutputKeyEnum.qaIsMatched,
      label: '匹配成功',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.boolean,
      targets: []
    },
    {
      key: ModuleOutputKeyEnum.qaUnMatched,
      label: '匹配失败',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.boolean,
      targets: []
    },
    {
      key: ModuleOutputKeyEnum.answerText,
      label: 'core.module.output.label.Ai response content',
      description: 'core.module.output.description.Ai response content',
      valueType: ModuleIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.source,
      targets: []
    },
    {
      key: ModuleOutputKeyEnum.datasetQuoteQA,
      label: 'core.module.Dataset quote.label',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.datasetQuote,
      targets: []
    },
    Output_Template_Finish
  ]
};
