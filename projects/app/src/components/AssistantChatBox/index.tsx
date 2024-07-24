import React, {
  useCallback,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useEffect
} from 'react';
import Script from 'next/script';
import { throttle } from 'lodash';
import type { ChatSiteItemType } from '@fastgpt/global/core/chat/type.d';
import type { ChatHistoryItemResType } from '@fastgpt/global/core/chat/type.d';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { getErrText } from '@fastgpt/global/common/error/utils';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  CircularProgress,
  Flex
} from '@chakra-ui/react';
import { adaptChat2GptMessages } from '@fastgpt/global/core/chat/adapt';
import { ModuleItemType } from '@fastgpt/global/core/module/type.d';
import { VariableInputEnum } from '@fastgpt/global/core/module/constants';
import { useForm } from 'react-hook-form';
import type { ChatMessageItemType } from '@fastgpt/global/core/ai/type.d';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { customAlphabet } from 'nanoid';

import { splitGuideModule } from '@fastgpt/global/core/module/utils';
import MessageInput from '@/components/ChatBox/MessageInput';
import { ModuleOutputKeyEnum } from '@fastgpt/global/core/module/constants';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import axios from 'axios';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 24);

const textareaMinH = '22px';

type generatingMessageProps = { text?: string; name?: string; status?: 'running' | 'finish' };

export type StartChatFnProps = {
  chatList: ChatSiteItemType[];
  messages: ChatMessageItemType[];
  controller: AbortController;
  variables: Record<string, any>;
  generatingMessage: (e: generatingMessageProps) => void;
};

export type AssistantComponentRef = {
  getChatHistories: () => ChatSiteItemType[];
  resetVariables: (data?: Record<string, any>) => void;
  resetHistory: (history: ChatSiteItemType[]) => void;
  scrollToBottom: (behavior?: 'smooth' | 'auto') => void;
  sendPrompt: (question: string) => void;
  start: () => void;
  stop: () => void;
};

enum FeedbackTypeEnum {
  user = 'user',
  admin = 'admin',
  hidden = 'hidden'
}

type Props = OutLinkChatAuthProps & {
  feedbackType?: `${FeedbackTypeEnum}`;
  showMarkIcon?: boolean; // admin mark dataset
  showVoiceIcon?: boolean;
  showEmptyIntro?: boolean;
  appAvatar?: string;
  userAvatar?: string;
  userGuideModule?: ModuleItemType;
  showFileSelector?: boolean;
  active?: boolean; // can use

  // not chat test params
  appId?: string;
  chatId?: string;

  onUpdateVariable?: (e: Record<string, any>) => void;
  onStartChat?: (e: StartChatFnProps) => Promise<{
    responseText: string;
    [ModuleOutputKeyEnum.responseData]: ChatHistoryItemResType[];
    isNewChat?: boolean;
  }>;
  onDelMessage?: (e: { contentId?: string; index: number }) => void;
};

const AssistantChatBox = (
  {
    userGuideModule,
    showFileSelector,
    active = true,
    appId,
    chatId,
    shareId,
    outLinkUid,
    teamId,
    teamToken,
    onUpdateVariable,
    onStartChat
  }: Props,
  ref: ForwardedRef<AssistantComponentRef>
) => {
  const ChatBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const TextareaDom = useRef<HTMLTextAreaElement>(null);
  const chatController = useRef(new AbortController());
  const isNewChatReplace = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatSiteItemType[]>([]);
  const signatureRef = useRef('');
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const cancelRef = React.useRef(null);

  // EndRTC before client destroy.
  useEffect(() => {
    return () => {
      if (client) {
        client.endRTC();
      }
    };
  }, [client]);

  // start RTC
  useEffect(() => {
    if (!signatureRef.current) {
      axios
        .get('https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen', {
          headers: {
            'Content-Type': 'application/json',
            'subscription-key': 'e4fea774231a4865b524c14d67255223'
          }
        })
        .then((response) => {
          signatureRef.current = response.data.data;
          if (!client) {
            const newClient = new window.RTCInteraction({
              mountClass: 'content',
              signature: signatureRef.current,
              timeout: 60 * 1000 * 5,
              projectId: '8720e05c-4810-11ef-8185-15e4c5cfd30b',
              onError(errorCode: number, errorMessage: string) {
                console.log(errorCode, errorMessage);
              },
              onInited() {
                console.log('inited...');
                newClient.startRTC();
              },
              onTalkStart(talkRes: any) {},
              onStopStream() {
                console.log('OnStopStream');
                setIsConnected(false);
              },
              onTalkEnd(talkRes: any) {}
            });
            setClient(newClient);
          }
        });
    }
  }, [client, signatureRef]);
  const isChatting = useMemo(
    () =>
      chatHistory[chatHistory.length - 1] &&
      chatHistory[chatHistory.length - 1]?.status !== 'finish',
    [chatHistory]
  );

  const { variableModules } = useMemo(() => splitGuideModule(userGuideModule), [userGuideModule]);
  const filterVariableModules = useMemo(
    () => variableModules.filter((item) => item.type !== VariableInputEnum.external),
    [variableModules]
  );

  // compute variable input is finish.
  const chatForm = useForm<{
    variables: Record<string, any>;
  }>({
    defaultValues: {
      variables: {}
    }
  });
  const { setValue, watch, handleSubmit } = chatForm;
  const variables = watch('variables');

  const [variableInputFinish, setVariableInputFinish] = useState(false); // clicked start chat button
  const variableIsFinish = useMemo(() => {
    if (!filterVariableModules || filterVariableModules.length === 0 || chatHistory.length > 0)
      return true;

    for (let i = 0; i < filterVariableModules.length; i++) {
      const item = filterVariableModules[i];
      if (item.required && !variables[item.key]) {
        return false;
      }
    }

    return variableInputFinish;
  }, [chatHistory.length, variableInputFinish, filterVariableModules, variables]);

  // 滚动到底部
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (!ChatBoxRef.current) return;
    ChatBoxRef.current.scrollTo({
      top: ChatBoxRef.current.scrollHeight,
      behavior
    });
  };

  // 聊天信息生成中……获取当前滚动条位置，判断是否需要滚动到底部
  const generatingScroll = useCallback(
    throttle(() => {
      if (!ChatBoxRef.current) return;
      const isBottom =
        ChatBoxRef.current.scrollTop + ChatBoxRef.current.clientHeight + 150 >=
        ChatBoxRef.current.scrollHeight;

      isBottom && scrollToBottom('auto');
    }, 100),
    []
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatingMessage = useCallback(
    ({ text = '', status, name }: generatingMessageProps) => {
      setChatHistory((state) =>
        state.map((item, index) => {
          if (index !== state.length - 1) return item;
          return {
            ...item,
            ...(text
              ? {
                  value: item.value + text
                }
              : {}),
            ...(status && name
              ? {
                  status,
                  moduleName: name
                }
              : {})
          };
        })
      );
      generatingScroll();
    },
    [generatingScroll]
  );

  // 重置输入内容
  const resetInputVal = useCallback((val: string) => {
    if (!TextareaDom.current) return;

    setTimeout(() => {
      /* 回到最小高度 */
      if (TextareaDom.current) {
        TextareaDom.current.value = val;
        TextareaDom.current.style.height =
          val === '' ? textareaMinH : `${TextareaDom.current.scrollHeight}px`;
      }
    }, 100);
  }, []);

  /**
   * user confirm send prompt
   */
  const sendPrompt = useCallback(
    ({
      inputVal = '',
      history = chatHistory
    }: {
      inputVal?: string;
      history?: ChatSiteItemType[];
    }) => {
      handleSubmit(async ({ variables }) => {
        if (!onStartChat) return;
        if (isChatting) {
          toast({
            title: '正在聊天中...请等待结束',
            status: 'warning'
          });
          return;
        }
        // get input value
        const val = inputVal.trim();

        if (!val) {
          toast({
            title: '内容为空',
            status: 'warning'
          });
          return;
        }

        console.log('聊天记录');
        console.log(history);

        const newChatList: ChatSiteItemType[] = [
          ...history,
          {
            dataId: nanoid(),
            obj: 'Human',
            value: val,
            status: 'finish'
          },
          {
            dataId: nanoid(),
            obj: 'AI',
            value: '',
            status: 'loading'
          }
        ];

        // 插入内容
        setChatHistory(newChatList);

        // 清空输入内容
        resetInputVal('');
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        try {
          // create abort obj
          const abortSignal = new AbortController();
          chatController.current = abortSignal;

          const messages = adaptChat2GptMessages({ messages: newChatList, reserveId: true });

          const {
            responseData,
            responseText,
            isNewChat = false
          } = await onStartChat({
            chatList: newChatList.map((item) => ({
              dataId: item.dataId,
              obj: item.obj,
              value: item.value,
              status: item.status,
              moduleName: item.moduleName
            })),
            messages,
            controller: abortSignal,
            generatingMessage,
            variables
          });

          isNewChatReplace.current = isNewChat;

          console.log('===============================================================');
          console.log('回答内容：');
          console.log(responseText);
          console.log('===============================================================');
          client.talk(responseText);

          // set finish status
          setChatHistory((state) =>
            state.map((item, index) => {
              if (index !== state.length - 1) return item;
              return {
                ...item,
                status: 'finish',
                responseData
              };
            })
          );
        } catch (err: any) {
          toast({
            title: t(getErrText(err, 'core.chat.error.Chat error')),
            status: 'error',
            duration: 5000,
            isClosable: true
          });

          if (!err?.responseText) {
            resetInputVal(inputVal);
            setChatHistory(newChatList.slice(0, newChatList.length - 2));
          }

          // set finish status
          setChatHistory((state) =>
            state.map((item, index) => {
              if (index !== state.length - 1) return item;
              return {
                ...item,
                status: 'finish'
              };
            })
          );
        }
      })();
    },
    [chatHistory, generatingMessage, handleSubmit, isChatting, onStartChat, resetInputVal, t, toast]
  );

  // output data
  useImperativeHandle(ref, () => ({
    getChatHistories: () => chatHistory,
    resetVariables(e) {
      const defaultVal: Record<string, any> = {};
      filterVariableModules?.forEach((item) => {
        defaultVal[item.key] = '';
      });

      setValue('variables', e || defaultVal);
    },
    resetHistory(e) {
      setVariableInputFinish(!!e.length);
      setChatHistory(e);
    },
    scrollToBottom,
    sendPrompt: (question: string) => {
      sendPrompt({
        inputVal: question
      });
    },
    start: () => {
      if (client) {
        client.startRTC();
      }
    },
    stop: () => {
      if (client) {
        client.endRTC();
      }
      window.location.reload();
    }
  }));

  // page change and abort request
  useEffect(() => {
    isNewChatReplace.current = false;
    return () => {
      chatController.current?.abort('leave');
    };
  }, [router.query]);

  // listen the visibility of the assistant
  // 选择要观察的目标节点
  const targetNode = document.body;
  // 配置观察器选项（检测子节点的变化）
  const config = { childList: true, subtree: true };
  // 创建一个新的观察器实例，并指定触发时的回调函数
  const observer = new MutationObserver(function (mutationsList, observer) {
    // 在每次发生变化时遍历所有变化
    for (let mutation of mutationsList) {
      // 如果新增节点是我们感兴趣的类别
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function (node: any) {
          if (node.nodeType === Node.ELEMENT_NODE && node?.classList.contains('show-video')) {
            // 在此处执行处理函数，因为已经找到了 class 为 show-video 的元素
            console.log('show-video 元素已出现！');
            setIsLoading(false);
            // 停止观察以避免进一步触发
            observer.disconnect();
          }
        });
      }
    }
  });
  // 开始观察目标节点，并配置观察器选项
  observer.observe(targetNode, config);

  return (
    <Flex flexDirection={'column'} h={'100%'}>
      <Script src="/js/html2pdf.bundle.min.js" strategy="lazyOnload"></Script>
      <AlertDialog isOpen={isLoading} leastDestructiveRef={cancelRef} onClose={() => {}}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              <Center>正在加载</Center>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Center>正在加载，请等待加载完成</Center>
              <Center width="100%" height="100%" mt={5}>
                <CircularProgress isIndeterminate color="green.300" />
              </Center>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {/* chat box container */}
      <Box ref={ChatBoxRef} flex={'1 0 0'} h={0} w={'100%'} overflow={'overlay'} px={[4, 0]} pb={3}>
        <Box id="chat-container" maxW={['100%', '92%']} h={'100%'} mx={'auto'}>
          <Center w="100%" h="100%">
            <Button
              style={{ display: !isConnected ? 'block' : 'none' }}
              onClick={() => {
                if (client) {
                  client.startRTC();
                }
                setIsLoading(true);
                setIsConnected(true);
              }}
            >
              点击重新连接
            </Button>
            <Box
              style={{ display: isConnected ? 'block' : 'none' }}
              w="100%"
              h="100%"
              className="content"
              onClick={() => {
                if (client) {
                  client.breakTalking();
                }
              }}
            ></Box>
          </Center>
        </Box>
      </Box>
      {/* message input */}
      {onStartChat && variableIsFinish && active && (
        <MessageInput
          onSendMessage={(inputVal) => {
            sendPrompt({
              inputVal
            });
          }}
          onStop={() => chatController.current?.abort('stop')}
          isChatting={isChatting}
          TextareaDom={TextareaDom}
          resetInputVal={resetInputVal}
          showFileSelector={showFileSelector}
          shareId={shareId}
          outLinkUid={outLinkUid}
          teamId={teamId}
          teamToken={teamToken}
        />
      )}
    </Flex>
  );
};

export default React.memo(forwardRef(AssistantChatBox));
