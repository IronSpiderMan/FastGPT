import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  CircularProgress
} from '@chakra-ui/react';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

// import {OpenAI} from 'openai';

interface DigitalHumanChatBoxProps {
  onSentenceEndCallback: (query: string) => Promise<string>;
}

export interface DigitalHumanChatBoxHandle {
  start: () => void;
  stop: () => void;
}

export async function fetch_chat(msg: string, prompt: string) {
  const url = 'http://localhost:3000/api/v1/chat/completions';
  const token = 'Bearer hku-eT8Zx6AIFEcJQ1uoAKnDiydGelU2UH7sK6NKUn5ThVOzlX86EpsP';

  const requestData = {
    chatId: '111',
    stream: false,
    detail: false,
    messages: [
      {
        content: prompt,
        role: 'system'
      },
      {
        content: msg,
        role: 'user'
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData['choices'][0]['message']['content'];
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return '暂时无法回答这个问题';
  }
}

// export async function chat(msg: string, prompt: string) {
//     console.log(process.env);
//     console.log(process.env.DIGITAL_HUMAN_BASE_URL, process.env.DIGITAL_HUMAN_API_KEY);
//     const client = new OpenAI({
//         baseURL: 'http://localhost:3000/api/v1',
//         apiKey: 'hku-eT8Zx6AIFEcJQ1uoAKnDiydGelU2UH7sK6NKUn5ThVOzlX86EpsP',
//         defaultHeaders: `Authorization: Bearer hku-eT8Zx6AIFEcJQ1uoAKnDiydGelU2UH7sK6NKUn5ThVOzlX86EpsP`,
//         dangerouslyAllowBrowser: true
//     });
//     try {
//         const completion = await client.chat.completions.create({
//             model: 'gpt-3.5-turbo',
//             messages: [
//                 {role: 'system', content: `${prompt}`},
//                 {role: 'user', content: `${msg}`}
//             ]
//         });
//         return completion.choices[0].message.content;
//     } catch (err) {
//         throw Error('Failed to send message');
//     }
// }

// eslint-disable-next-line react/display-name
const DigitalHumanChatBox = forwardRef<DigitalHumanChatBoxHandle, DigitalHumanChatBoxProps>(
  (props, ref) => {
    const { onSentenceEndCallback } = props;
    let client: any = null;
    let asr: any = null;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const cancelRef = React.useRef(null);
    let signature: string = '';
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
    // 连接数字人
    const connectDigitalHuman = () => {
      //创建Asr
      if (window.AsrSDK) {
        asr = new window.AsrSDK({
          onSentenceEnd(res: any) {
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
            if (client) {
              // console.log("回答", answer)
              console.log('onSentenceEnd', '暂停识别');
              asr.stop();
              fetch_chat(
                query,
                '我希望你能充当香港科技大学（广州校区）的熊博士，性别男。我将扮演提问的学生，请尽可能简短回复我。我需要将你回复的内容进行TTS，因此需要你回复适合TTS的内容，无论我问什么都不要回复代码、markdown、bash、cmd、shell等内容。'
              )
                .then((resp) => {
                  console.log('回复内容', resp);
                  client.talk(resp);
                })
                .catch((err) => {
                  console.log('回复内容', err);
                  client.talk('暂时无法回答，请联系本人解答');
                });
            }
          }
        });
      }
      fetch('https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'subscription-key': 'e4fea774231a4865b524c14d67255223'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((res) => {
          if (window.RTCInteraction) {
            client = new window.RTCInteraction({
              mountClass: 'content',
              signature: res?.data,
              projectId: 'ec458327-02fb-11ef-a49e-1d85fe26a7cf',
              onError(errorCode: number, errorMessage: string) {
                console.log(errorCode, errorMessage);
              },
              onInited() {
                console.log('inited...');
                signature = res?.data;
                client.startRTC();
              },
              onTalkStart(talkRes: any) {
                asr.stop();
                console.log('onTalkStart', '暂停识别');
              },
              onStopStream() {
                asr.stop();
                console.log('暂停识别');
                // setIsConnected(false);
              },
              onTalkEnd(talkRes: any) {
                asr.start(signature);
                console.log('onTalkEnd', '开始识别');
              }
            });
          }
        })
        .catch((error) => {
          console.error('There was a problem with the fetch operation:', error);
        });
    };
    useEffect(() => {
      return () => {
        console.log('============================================================');
        console.log('Stop Digital Human');
        console.log(client, asr);
        console.log('============================================================');
        if (client) {
          console.log('End RTC');
          client.endRTC();
        }
        if (asr) {
          console.log('End Asr');
          asr.stop();
        }
        setIsConnected(false);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      start() {
        console.log('Start DigitalHuman');
        console.log('连接数字人');
        console.log(client, asr);
        connectDigitalHuman();
        setIsConnected(true);
      },
      stop() {
        console.log(client, asr);
      }
    }));
    return (
      <>
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
        {!isConnected && (
          <Center w="100%" h="100%">
            <Button>点击重新连接</Button>
          </Center>
        )}
        {isConnected && (
          <Center w="100%" h="100%">
            <Box w="100%" h="100%" className="content"></Box>
          </Center>
        )}
      </>
    );
  }
);
export default DigitalHumanChatBox;
