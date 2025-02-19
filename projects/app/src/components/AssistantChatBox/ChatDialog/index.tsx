import { Box, Center, Text, VStack } from '@chakra-ui/react';

interface ChatMessageProps {
  question: string;
  answer: string;
}

const ChatDialog = ({ question, answer }: ChatMessageProps) => {
  return (
    <VStack
      align="start"
      spacing={4}
      p={4}
      borderRadius="lg"
      boxShadow="lg"
      bg="#1f1f3a" // 深蓝紫色背景
      color="white"
      w="100%"
    >
      {/* Header */}
      <Box w="100%">
        <Center>
          <Text fontWeight="bold" fontSize="lg" color="#47C2FF">
            当前对话内容
          </Text>
        </Center>
      </Box>

      {/* Question Box */}
      <Box
        w="100%"
        bg="rgb(35, 47, 77)" // 半透明白色背景
        borderRadius="md"
        p={3}
        mb={2}
      >
        <Text fontSize="md" lineHeight="1.6" fontWeight="bold" color="#CFC7CB">
          {question}
        </Text>
      </Box>

      {/* Answer Box */}
      <Box
        w="100%"
        bg="rgb(60, 59, 76)" // 半透明白色背景
        borderRadius="md"
        p={3}
        minH="100px"
        maxH="150px"
        overflowY="auto"
      >
        <Text fontSize="md" lineHeight="1.6" color="#D0C0BE">
          {answer}
        </Text>
      </Box>
    </VStack>
  );
};

export default ChatDialog;
