import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, IconButton, useTheme } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useQuery } from '@tanstack/react-query';

import Avatar from '@/components/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import PageContainer from '@/components/PageContainer';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useAssistantStore } from '@/web/core/assistant/store/useAssistantStore';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import AssistantInfo from '@/pages/assistant/detail/components/Info';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

enum TabEnum {
  'simpleEdit' = 'simpleEdit',
  'adEdit' = 'adEdit',
  'publish' = 'publish',
  'logs' = 'logs',
  'startChat' = 'startChat'
}

const AssistantDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { toast } = useToast();
  const { assistantId } = router.query as { assistantId: string };
  const { assistantDetail, loadAssistantDetail } = useAssistantStore();
  const { userInfo } = useUserStore();
  useEffect(() => {
    if (userInfo?.team?.role !== TeamMemberRoleEnum.superAdmin) {
      router.push('/app/list');
    }
    if (!assistantId) {
      router.push('/assistant/list');
    }
  }, [router, userInfo, assistantId]);
  useEffect(() => {
    const listen =
      process.env.NODE_ENV === 'production'
        ? (e: any) => {
            e.preventDefault();
            e.returnValue = t('core.common.tip.leave page');
          }
        : () => {};
    window.addEventListener('beforeunload', listen);

    return () => {
      window.removeEventListener('beforeunload', listen);
    };
  }, [t]);

  useQuery([assistantId], () => loadAssistantDetail(assistantId, true), {
    onError(err: any) {
      toast({
        title: err?.message || t('core.app.error.Get app failed'),
        status: 'error'
      });
      router.replace('/assistant/list');
    },
    onSettled() {
      router.prefetch(`/assistant?assistantId=${assistantId}`);
    }
  });

  return (
    <>
      <Head>
        <title>{assistantDetail.name}</title>
      </Head>
      <PageContainer>
        <Flex flexDirection={['column', 'row']} h={'100%'}>
          {/* pc tab */}
          <Box
            display={['none', 'flex']}
            flexDirection={'column'}
            p={4}
            w={'180px'}
            borderRight={theme.borders.base}
          >
            <Flex mb={4} alignItems={'center'}>
              <Avatar src={assistantDetail.avatar} w={'34px'} borderRadius={'md'} />
              <Box ml={2} fontWeight={'bold'}>
                {assistantDetail.name}
              </Box>
            </Flex>

            <Flex
              alignItems={'center'}
              cursor={'pointer'}
              py={2}
              px={3}
              borderRadius={'md'}
              _hover={{ bg: 'myGray.100' }}
              onClick={() => router.replace('/assistant/list')}
            >
              <IconButton
                mr={3}
                icon={<MyIcon name={'common/backFill'} w={'18px'} color={'primary.500'} />}
                bg={'white'}
                boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
                size={'smSquare'}
                borderRadius={'50%'}
                aria-label={''}
              />
              {t('app.My Apps')}
            </Flex>
          </Box>
          {/* phone tab */}
          <Box display={['block', 'none']} textAlign={'center'} py={3}>
            <Box className="textlg" fontSize={'xl'} fontWeight={'bold'}>
              {assistantDetail.name}
            </Box>
          </Box>
          <Box flex={'1 0 0'} h={[0, '100%']} overflow={['overlay', '']}>
            {/*{'表单内容'}*/}
            <Flex justifyContent={'center'}>
              <AssistantInfo />
            </Flex>
          </Box>
        </Flex>
      </PageContainer>
    </>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: { ...(await serviceSideProps(context)) }
  };
}

export default AssistantDetail;
