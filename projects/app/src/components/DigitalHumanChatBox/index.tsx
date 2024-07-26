import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  Flex,
  CircularProgress
} from '@chakra-ui/react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import axios from 'axios';
import { getSignature } from '@/web/core/assistant/api';

interface DigitalHumanChatBoxProps {
  onSentenceEndCallback: (query: string) => Promise<string>;
}

export interface DigitalHumanChatBoxHandle {
  start: () => void;
  stop: () => void;
}

export async function chat(message: string) {
  try {
    const response = await axios.post<any>(`http://localhost:8080/api/v1/assistants/rag`, null, {
      params: {
        message: encodeURIComponent(message)
      },
      headers: {
        Accept: 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.log('Fetch error', error);
    throw error;
  }
}

// eslint-disable-next-line react/display-name
const DigitalHumanChatBox = forwardRef<DigitalHumanChatBoxHandle, DigitalHumanChatBoxProps>(
  (props, ref) => {
    const [client, setClient] = useState<any>(null);
    const [asr, setAsr] = useState<any>(null);
    const signatureRef = useRef('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const cancelRef = React.useRef(null);
    useEffect(() => {
      if (!signatureRef.current) {
        getSignature().then((response: any) => {
          // 获取signature
          signatureRef.current = response?.data?.signature;
          console.log('获取的signature', signatureRef.current);
          if (!client) {
            const newClient = new window.RTCInteraction({
              mountClass: 'content',
              signature: signatureRef.current,
              projectId: 'ec458327-02fb-11ef-a49e-1d85fe26a7cf',
              onError(errorCode: number, errorMessage: string) {
                console.log(errorCode, errorMessage);
              },
              onInited() {
                console.log('inited...');
                newClient.startRTC();
                if (!asr) {
                  const newAsr = new window.AsrSDK({
                    onSentenceEnd: function (res: any) {
                      let query = res?.result?.voice_text_str;
                      console.log('识别到文本', query);
                      if (
                        !query ||
                        query.trim() === '' ||
                        query.trim().length < 2 ||
                        query.trim() === '嗯。'
                      ) {
                        console.log('暂不能回答问题');
                        return;
                      }
                      // const answer = onSentenceEndCallback(query.trim())
                      if (newClient) {
                        console.log('onSentenceEnd', '暂停识别');
                        newAsr.stop();
                        chat(query)
                          .then((resp) => {
                            console.log(resp);
                            newClient.talk(resp?.message);
                          })
                          .catch((err) => {
                            console.log('回复内容', err);
                            newClient.talk('暂时无法回答，请联系本人解答');
                          });
                      }
                    }
                  });
                  setAsr(newAsr);
                }
              },
              onTalkStart(talkRes: any) {
                if (asr) {
                  asr.stop();
                }
                console.log('onTalkStart', '暂停识别');
              },
              onStopStream() {
                if (asr) {
                  asr.stop();
                }
                console.log('暂停识别');
              },
              onTalkEnd(talkRes: any) {
                console.log('signature: ', signatureRef.current);
                if (asr) {
                  asr.start(signatureRef.current);
                }
                console.log('onTalkEnd', '开始识别');
              }
            });
            setClient(newClient);
          }
        });
      }
    }, [client, asr, signatureRef]);
    if (navigator?.mediaDevices) {
      navigator?.mediaDevices
        ?.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
        })
        .catch((err) => {
          console.log('麦克风权限获取失败', err);
        });
    } else {
      console.log('浏览器不支持录音功能');
    }
    // 监听show-video出现
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
    useImperativeHandle(ref, () => ({
      start() {
        console.log('Start DigitalHuman');
        console.log('连接数字人');
        setIsConnected(true);
      },
      stop() {
        console.log('Stop DigitalHuman');
        if (asr) {
          console.log('停止asr');
          asr.stop();
        }
        if (client) {
          console.log('停止RTC');
          client.endRTC();
        }
      }
    }));
    return (
      <Flex flexDirection={'column'} h={'100%'}>
        <AlertDialog
          isOpen={isLoading}
          leastDestructiveRef={cancelRef}
          onClose={() => {
            console.log(1);
          }}
        >
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
        <Box></Box>
        {!isConnected && (
          <Center w="100%" h="100%">
            <Button>点击重新连接</Button>
          </Center>
        )}
        {isConnected && (
          <Center w="100%" h="100%">
            <Box
              w="100%"
              h="100%"
              className="content"
              onClick={() => {
                console.log(process.env.RAG_BASE_URL);
                if (client) {
                  client.breakTalking();
                }
                if (signatureRef.current && asr) {
                  asr.start(signatureRef.current);
                }
              }}
            ></Box>
          </Center>
        )}
      </Flex>
    );
  }
);
export default DigitalHumanChatBox;
