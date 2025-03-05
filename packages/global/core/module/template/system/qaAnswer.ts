import { FlowNodeOutputTypeEnum, FlowNodeTypeEnum } from '../../node/constant';
import { FlowModuleTemplateType } from '../../type';
import {
  ModuleIOValueTypeEnum,
  ModuleOutputKeyEnum,
  ModuleTemplateTypeEnum
} from '../../constants';
import {
  Input_Template_Dataset_Quote,
  Input_Template_Switch,
  Input_Template_Threshold,
  Input_Template_UserChatInput
} from '../input';
import { Output_Template_Finish, Output_Template_UserChatInput } from '../output';

export const QaChatModule: FlowModuleTemplateType = {
  id: FlowNodeTypeEnum.qaChatNode,
  templateType: ModuleTemplateTypeEnum.textAnswer,
  flowType: FlowNodeTypeEnum.qaChatNode,
  avatar: '/imgs/module/AI.png',
  name: 'QA问答',
  intro: '匹配用户输入和知识库检索内容，返回精准回答',
  showStatus: true,
  inputs: [
    Input_Template_Switch,
    Input_Template_UserChatInput,
    Input_Template_Dataset_Quote,
    Input_Template_Threshold
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
    Output_Template_Finish
  ]
};
