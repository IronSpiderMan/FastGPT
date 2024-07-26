import React, { useCallback, useState, useEffect } from 'react';
import { Box, Grid, Flex, IconButton, Button, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { AddIcon } from '@chakra-ui/icons';
import { delAssistantById } from '@/web/core/assistant/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import PageContainer from '@/components/PageContainer';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import CreateModal from './components/CreateModal';
import { useAssistantStore } from '@/web/core/assistant/store/useAssistantStore';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

const Assistants = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const { assistants, loadAssistants } = useAssistantStore();
  const { userInfo } = useUserStore();
  useEffect(() => {
    if (userInfo?.team?.role !== TeamMemberRoleEnum.superAdmin) {
      router.push('/app/list');
    }
  }, [router, userInfo]);
  const { openConfirm, ConfirmModal } = useConfirm({
    title: '删除提示',
    content: '确认删除该应用所有信息？'
  });
  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal
  } = useDisclosure();

  /* 点击删除 */
  const onclickDelAssistant = useCallback(
    async (id: string) => {
      try {
        await delAssistantById(id);
        toast({
          title: '删除成功',
          status: 'success'
        });
        await loadAssistants(true);
      } catch (err: any) {
        toast({
          title: err?.message || '删除失败',
          status: 'error'
        });
      }
    },
    [toast, loadAssistants]
  );

  /* 加载模型 */
  const { isFetching } = useQuery(['loadApps'], () => loadAssistants(true), {
    refetchOnMount: true
  });

  return (
    <PageContainer isLoading={isFetching} insertProps={{ px: [5, '48px'] }}>
      <Flex pt={[4, '30px']} alignItems={'center'} justifyContent={'space-between'}>
        <Box letterSpacing={1} fontSize={['20px', '24px']} color={'myGray.900'}>
          {t('assistant.All Assistants')}
        </Box>
        <Button leftIcon={<AddIcon />} variant={'primaryOutline'} onClick={onOpenCreateModal}>
          {t('common.New Create')}
        </Button>
      </Flex>
      <Grid
        py={[4, 6]}
        gridTemplateColumns={['1fr', 'repeat(2,1fr)', 'repeat(3,1fr)', 'repeat(4,1fr)']}
        gridGap={5}
      >
        {assistants.map((assistant) => (
          <MyTooltip key={assistant._id} label={t('app.To Settings')}>
            <Box
              lineHeight={1.5}
              h={'100%'}
              py={3}
              px={5}
              cursor={'pointer'}
              borderWidth={'1.5px'}
              borderColor={'borderColor.low'}
              bg={'white'}
              borderRadius={'md'}
              userSelect={'none'}
              position={'relative'}
              display={'flex'}
              flexDirection={'column'}
              _hover={{
                borderColor: 'primary.300',
                boxShadow: '1.5',
                '& .delete': {
                  display: 'flex'
                },
                '& .chat': {
                  display: 'flex'
                }
              }}
              onClick={() => {
                router.push(`/assistant/detail?assistantId=${assistant._id}`);
              }}
            >
              <Flex alignItems={'center'} h={'38px'}>
                <Avatar src={assistant.avatar} borderRadius={'md'} w={'28px'} />
                <Box ml={3}>{assistant.name}</Box>
                <IconButton
                  className="delete"
                  position={'absolute'}
                  top={4}
                  right={4}
                  size={'xsSquare'}
                  variant={'whiteDanger'}
                  icon={<MyIcon name={'delete'} w={'14px'} />}
                  aria-label={'delete'}
                  display={['', 'none']}
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirm(() => onclickDelAssistant(assistant._id))();
                  }}
                />
              </Flex>
              <Box
                flex={1}
                className={'textEllipsis3'}
                py={2}
                wordBreak={'break-all'}
                fontSize={'sm'}
                color={'myGray.600'}
              >
                {assistant.intro || '这个应用还没写介绍~'}
              </Box>
            </Box>
          </MyTooltip>
        ))}
      </Grid>
      {assistants.length === 0 && (
        <Flex mt={'35vh'} flexDirection={'column'} alignItems={'center'}>
          <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
          <Box mt={2} color={'myGray.500'}>
            还没有应用，快去创建一个吧！
          </Box>
        </Flex>
      )}
      <ConfirmModal />
      {isOpenCreateModal && (
        <CreateModal onClose={onCloseCreateModal} onSuccess={() => loadAssistants(true)} />
      )}
    </PageContainer>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}

export default Assistants;
