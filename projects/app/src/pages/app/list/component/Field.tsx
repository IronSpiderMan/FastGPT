import { Box, Flex, Grid, IconButton } from '@chakra-ui/react';
import MyTooltip from '@/components/MyTooltip';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import Avatar from '@/components/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import React, { useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useRouter } from 'next/router';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import CreateModal from '@/pages/app/list/component/CreateModal';

interface AppGroupProps {
  field: string;
  apps: AppListItemType[];
  onclickDelApp: (id: string) => Promise<void>;
}

const Field = ({ field, apps, onclickDelApp }: AppGroupProps) => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();
  const router = useRouter();
  const { openConfirm, ConfirmModal } = useConfirm({
    title: '删除提示',
    content: '确认删除该应用所有信息？'
  });
  return (
    <Box w={'100%'} h={'auto'}>
      <Box fontSize={'5xl'} fontWeight={'bold'} color={'darkgoldenrod'} p={'5'}>
        {field}
      </Box>
      <Grid
        py={[4, 6]}
        gridTemplateColumns={['1fr', 'repeat(2,1fr)', 'repeat(3,1fr)', 'repeat(4,1fr)']}
        gridGap={5}
      >
        {/* TODO 需要设置只有owner和superAdmin才能编辑和删除   */}
        {apps.map((app) => (
          <MyTooltip
            key={app._id}
            // label={userInfo?.team.canWrite ? t('app.To Settings') : t('app.To Chat')}
            label={app.intro || '还没写介绍~'}
          >
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
              backgroundImage="linear-gradient(rgba(221, 247, 251, 0.8), rgba(221, 247, 251, 0.9)), url('/imgs/chip.png')"
              // backgroundImage={'url(/imgs/chip.png)'}
              backgroundSize={'cover'}
              backgroundColor={'#DDF7FB'}
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
                // 只有superAdmin或者owner才能跳转配置页面，其余用户跳转聊天页面
                if (app.isOwner || userInfo?.team?.role === TeamMemberRoleEnum.superAdmin) {
                  router.push(`/app/detail?appId=${app._id}`);
                } else {
                  router.push(`/chat?appId=${app._id}`);
                }
                // if (userInfo?.team.canWrite) {
                //   router.push(`/app/detail?appId=${app._id}`);
                // } else {
                //   router.push(`/chat?appId=${app._id}`);
                // }
              }}
            >
              <Flex alignItems={'center'} h={'50px'}>
                <Avatar src={app.avatar} borderRadius={'md'} w={'45px'} />
                <Flex flexDirection={'column'}>
                  <Box
                    ml={3}
                    fontWeight={'bold'}
                    color={'#98A0A4'}
                    // style={{writingMode: 'vertical-rl'}}
                  >
                    {app.name.slice(0, 3)}
                  </Box>
                  <Box
                    ml={3}
                    color={'#98A0A4'}
                    // style={{writingMode: 'vertical-rl'}}
                  >
                    毕业学校：{app.assistant?.graduationSchool}
                  </Box>
                </Flex>
                {/*{app.isOwner && userInfo?.team.canWrite && (*/}
                {(app.isOwner || userInfo?.team.role === TeamMemberRoleEnum.superAdmin) && (
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
                      openConfirm(() => onclickDelApp(app._id))();
                    }}
                  />
                )}
              </Flex>
              <Box
                flex={1}
                className={'textEllipsis3'}
                py={2}
                wordBreak={'normal'}
                fontSize={'sm'}
                // color={'myGray.600'}
                minHeight="100px" // 设置最小高度
                color={'#98A0A4'}
                whiteSpace={'preserve'}
              >
                {app.intro || '还没写介绍~'}
              </Box>
              <Flex h={'34px'} alignItems={'flex-end'}>
                <Box flex={1}>
                  {/*<PermissionIconText permission={app.permission} color={'myGray.600'}/>*/}
                </Box>
                {userInfo?.team.canWrite && (
                  <IconButton
                    className="chat"
                    size={'xsSquare'}
                    variant={'whitePrimary'}
                    icon={
                      <MyTooltip label={'去聊天'}>
                        <MyIcon name={'core/chat/chatLight'} w={'14px'} />
                      </MyTooltip>
                    }
                    aria-label={'chat'}
                    display={['', 'none']}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat?appId=${app._id}`);
                    }}
                  />
                )}
              </Flex>
            </Box>
          </MyTooltip>
        ))}
      </Grid>
      <ConfirmModal />
    </Box>
  );
};
export default Field;
