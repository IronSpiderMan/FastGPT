import React, { useCallback, useState, useEffect } from 'react';
import { Box, Grid, Flex, IconButton, Button, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { AddIcon } from '@chakra-ui/icons';
import { delModelById } from '@/web/core/app/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import PageContainer from '@/components/PageContainer';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import CreateModal from './component/CreateModal';
import { useAppStore } from '@/web/core/app/store/useAppStore';
import PermissionIconText from '@/components/support/permission/IconText';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import Field from '@/pages/app/list/component/Field';

type Dictionary<T> = {
  [key: string]: T;
};

const MyApps = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { myApps, loadMyApps } = useAppStore();
  const [groupedApps, setGroupedApps] = useState<Dictionary<AppListItemType[]>>({});
  const [teamsTags, setTeamTags] = useState([]);
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
  const onclickDelApp = useCallback(
    async (id: string) => {
      try {
        await delModelById(id);
        toast({
          title: '删除成功',
          status: 'success'
        });
        loadMyApps(true);
      } catch (err: any) {
        toast({
          title: err?.message || '删除失败',
          status: 'error'
        });
      }
    },
    [toast, loadMyApps]
  );

  useEffect(() => {
    const tmp: Dictionary<AppListItemType[]> = {};
    myApps.forEach((app) => {
      const key = app.assistant?.field || 'default'; // 为空时给默认值
      if (!tmp[key]) {
        tmp[key] = [app];
      } else {
        tmp[key].push(app);
      }
    });
    setGroupedApps(tmp);
  }, [myApps]);

  /* 加载模型 */
  const { isFetching } = useQuery(['loadApps'], () => loadMyApps(true), {
    refetchOnMount: true
  });

  return (
    <PageContainer isLoading={isFetching} insertProps={{ px: [5, '48px'] }}>
      <Flex pt={[4, '30px']} alignItems={'center'} justifyContent={'space-between'}>
        <Box letterSpacing={1} fontSize={['20px', '24px']} color={'myGray.900'}>
          {t('app.My Apps')}
        </Box>
        {userInfo?.team.role === TeamMemberRoleEnum.superAdmin && (
          <Button leftIcon={<AddIcon />} variant={'primaryOutline'} onClick={onOpenCreateModal}>
            {t('common.New Create')}
          </Button>
        )}
        {/*<Button leftIcon={<AddIcon />} variant={'primaryOutline'} onClick={onOpenCreateModal}>*/}
        {/*  {t('common.New Create')}*/}
        {/*</Button>*/}
      </Flex>

      <Box
        w={'100%'}
        h={'auto'}
        mt={'5'}
        mb={'5'}
        p={'5'}
        borderRadius={'15px'}
        backgroundColor={'white'}
        borderWidth={'2px'}
        borderColor={'gray.100'}
      >
        {groupedApps &&
          Object.entries(groupedApps).map(([key, value]) => (
            <Box key={key}>
              <Field field={key} apps={groupedApps[key]} onclickDelApp={onclickDelApp} />
            </Box>
          ))}
        {/*{myApps.map((app: AppListItemType) => (*/}
        {/*    <Box w={'100%'} h={'200px'} mt={'3'} key={app._id} backgroundColor={'red'}/>*/}
        {/*))}*/}
        {/*{Object.keys(groupedApps).forEach((key: string) => {*/}
        {/*    <Field key={key} field={key} apps={groupedApps[key]} onclickDelApp={onclickDelApp}/>*/}
        {/*})}*/}
        {/*{Object.entries(groupedApps).forEach(([key, value]) => (*/}
        {/*    <Box backgroundColor={"red"}/>*/}
        {/*))}*/}
        {/*{groupedApps.map((group)=>(*/}
        {/*    <Field key={group.field} field={group.field} apps={group.apps} onclickDelApp={onclickDelApp}/>*/}
        {/*))}*/}
        {/*{groupedApps.map((group: GroupedAppListItem)=>{*/}
        {/*    <Field field={group.field} apps={group.apps} onclickDelApp={onclickDelApp}*/}
        {/*})}*/}
        {/* (
        <ShareBox></ShareBox>
      ) */}
      </Box>

      {myApps.length === 0 && (
        <Flex mt={'35vh'} flexDirection={'column'} alignItems={'center'}>
          <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
          <Box mt={2} color={'myGray.500'}>
            还没有应用，快去创建一个吧！
          </Box>
        </Flex>
      )}
      <ConfirmModal />
      {isOpenCreateModal && (
        <CreateModal onClose={onCloseCreateModal} onSuccess={() => loadMyApps(true)} />
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

export default MyApps;
