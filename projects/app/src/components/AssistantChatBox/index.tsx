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
  calc,
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
import { useAppStore } from '@/web/core/app/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import ChatDialog from '@/components/AssistantChatBox/ChatDialog';

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
  const avatarWsRef = useRef(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cancelRef = React.useRef(null);
  const { loadAppDetail } = useAppStore();
  const [avatarId, setAvatarId] = useState<string>('');
  const [question, setQuestion] = useState<string>('你好啊！');
  const [answer, setAnswer] = useState<string>('你好，有什么可以帮助你的！');

  useQuery([appId], () => loadAppDetail(appId ? appId : '', true), {
    onError(err: any) {
      toast({
        title: err?.message || t('core.app.error.Get app failed'),
        status: 'error'
      });
      router.replace('/app/list');
    },
    onSuccess(data: any) {
      setAvatarId(data.assistant.projectId);
    }
  });

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatingMessage = useCallback(({ text = '', status, name }: generatingMessageProps) => {
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
  }, []);

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

        // 设置ChatDialog的内容
        setQuestion(inputVal.trim());

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

          setAnswer(responseText.trim());
          console.log('===============================================================');
          console.log('回答内容：');
          console.log(responseText);
          console.log('===============================================================');
          if (avatarWsRef.current) {
            (avatarWsRef.current as any).talk(responseText.replace(/[#*@$]/g, ' '));
          }

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
    sendPrompt: (question: string) => {
      sendPrompt({
        inputVal: question
      });
    },
    start: () => {
      console.log('start');
    },
    stop: () => {
      console.log('end');
    }
  }));

  // page change and abort request
  useEffect(() => {
    isNewChatReplace.current = false;
    return () => {
      chatController.current?.abort('leave');
    };
  }, [router.query]);

  useEffect(() => {
    if (avatarId && avatarWsRef && avatarWsRef.current) {
      (avatarWsRef.current as any).connect(avatarId);
    }
  }, [avatarId]);

  useEffect(() => {
    setIsLoading(false);
    if (typeof window !== 'undefined' && window?.AvatarWebsocket) {
      avatarWsRef.current = new window.AvatarWebsocket(
        // 'content', 'https://hat-assistant-nffiot.hkust-gz.edu.cn/wav2lip/api/v1',
        'content',
        'assistant-nffiot.hkust-gz.edu.cn/api/dm',
        {
          onClose: () => {
            console.log('数字人停了');
          },
          onReady: () => {
            console.log('连接成功');
            setIsLoading(false);
          },
          onError: (error: string) => {
            console.log(error);
          }
        },
        true
      );
    }
    return () => {
      if (avatarWsRef.current) {
        (avatarWsRef.current as any).close();
      }
    };
  }, []);

  return (
    <Flex
      flexDirection={'column'}
      position="relative"
      h={'100%'}
      // backgroundImage="linear-gradient(rgba(255, 255,255,0.5), rgba(255, 255,255,0.5)), url('/imgs/bg.png')"
      backgroundImage="url('/imgs/bg.png')"
    >
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
          <Box h={'calc(100% - 400px)'}></Box>
          <Center w="100%" h="400px">
            <Box
              id={'content'}
              h={'400px'}
              onClick={async () => {
                if (avatarWsRef.current) {
                  try {
                    await (avatarWsRef.current as any).interrupt(); // 等待异步操作完成
                  } catch (error) {
                    console.error('Interrupt failed:', error); // 捕获可能的错误
                  }
                }
              }}
            />
          </Center>
        </Box>
      </Box>
      <Box position="absolute" bottom={'200px'} w={'240px'} right="20px">
        <ChatDialog question={question} answer={answer} />
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
