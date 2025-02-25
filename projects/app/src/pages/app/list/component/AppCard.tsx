import { AppListItemType } from '@fastgpt/global/core/app/type';
import { Box, Flex, IconButton, Image } from '@chakra-ui/react';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@/components/MyTooltip';
import React from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useConfirm } from '@/web/common/hooks/useConfirm';

interface AppCardProps {
  app: AppListItemType;
  onclickDelApp: (id: string) => Promise<void>;
}

const AppCard = ({ app, onclickDelApp }: AppCardProps) => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { openConfirm, ConfirmModal } = useConfirm({
    title: '删除提示',
    content: '确认删除该应用所有信息？'
  });

  return (
    <>
      <MyTooltip key={app._id} label={app.intro || '还没写介绍~'}>
        <Box
          h={'200px'}
          cursor={'pointer'}
          borderWidth={'1.5px'}
          borderColor={'borderColor.low'}
          bg={'white'}
          borderRadius={'md'}
          userSelect={'none'}
          position={'relative'}
          display={'flex'}
          backgroundImage="linear-gradient(rgba(221, 247, 251, 0.8), rgba(221, 247, 251, 0.9)), url('/imgs/chip.png')"
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
            if (app.isOwner || userInfo?.team?.role === TeamMemberRoleEnum.superAdmin) {
              router.push(`/app/detail?appId=${app._id}`);
            } else {
              router.push(`/chat?appId=${app._id}`);
            }
          }}
        >
          {/* Left side - Image */}
          <Box h={'full'} w={'120px'} position={'relative'}>
            <Image
              src={app.avatar}
              w={'full'}
              h={'full'}
              objectFit={'cover'}
              borderLeftRadius={'md'}
            />
          </Box>

          {/* Right side - Content */}
          <Flex flexDirection={'column'} flex={1} p={4}>
            {/* Top section - Name and School */}
            <Flex justifyContent={'space-between'} mb={3}>
              <Flex flexDirection={'column'}>
                <Box fontSize={'xl'} fontWeight={'bold'} color={'#98A0A4'}>
                  {app.name}
                </Box>
                <Box fontSize={'lg'} color={'#98A0A4'} mt={1}>
                  {app.assistant?.graduationSchool}
                </Box>
              </Flex>

              {/* Delete button */}
              {(app.isOwner || userInfo?.team.role === TeamMemberRoleEnum.superAdmin) && (
                <IconButton
                  className="delete"
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

            {/* Bottom section - Intro and Chat button */}
            <Flex flexDirection={'column'} flex={1}>
              <Box
                flex={1}
                pt={2}
                fontSize={'sm'}
                color={'#98A0A4'}
                className={'textEllipsis3'}
                overflow={'hidden'}
                maxW={'200px'}
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: '3'
                }}
              >
                {app.intro || '还没写介绍~'}
              </Box>

              {/* Chat button */}
              <Flex justifyContent={'flex-end'} mt={2}>
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
            </Flex>
          </Flex>
        </Box>
      </MyTooltip>
      <ConfirmModal />
    </>
  );
};

export default AppCard;
