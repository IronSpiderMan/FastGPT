import React, { useCallback, useState } from 'react';
import { Box, Flex, Button, ModalFooter, ModalBody, Input, Text } from '@chakra-ui/react';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { useForm } from 'react-hook-form';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRequest } from '@/web/common/hooks/useRequest';
import Avatar from '@/components/Avatar';
import MyTooltip from '@/components/MyTooltip';
import MyModal from '@/components/MyModal';
import { useTranslation } from 'next-i18next';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import { UserStatusEnum, userStatus } from '@fastgpt/global/support/user/constant';
import { postCreateUser } from '@/web/support/user/api';
import { TeamMemberRoleEnum, TeamMemberRoles } from '@fastgpt/global/support/user/team/constant';
import MySelect from '@/components/Select';

type FormType = {
  username: string;
  password: string;
  avatar: string;
  balance: number;
  promotionRate: number;
  status: `${UserStatusEnum}`;
  role: `${TeamMemberRoleEnum}`;
};

const CreateModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(false);
  const { isPc } = useSystemStore();
  const [selectedStatus, setSelectedStatus] = useState<string>(userStatus[0].value);
  const [selectedRole, setSelectedRole] = useState<string>(TeamMemberRoles[0].value);
  const { register, setValue, getValues, handleSubmit } = useForm<FormType>({
    defaultValues: {
      username: '',
      password: '',
      avatar: '/icon/logo.svg',
      balance: 200000,
      promotionRate: 15,
      status: `${UserStatusEnum.active}`,
      role: `${TeamMemberRoleEnum.visitor}`
    }
  });
  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file) return;
      try {
        const src = await compressImgFileAndUpload({
          type: MongoImageTypeEnum.assistantAvatar,
          file,
          maxW: 300,
          maxH: 300
        });
        setValue('avatar', src);
        setRefresh((state) => !state);
      } catch (err: any) {
        toast({
          title: getErrText(err, t('common.error.Select avatar failed')),
          status: 'warning'
        });
      }
    },
    [setValue, t, toast]
  );

  const { mutate: onclickCreate, isLoading: creating } = useRequest({
    mutationFn: async (data: FormType) => {
      return postCreateUser({
        avatar: data.avatar,
        username: data.username,
        password: data.password,
        balance: data.balance,
        promotionRate: data.promotionRate,
        status: data.status,
        role: data.role
      });
    },
    onSuccess(id: string) {
      onSuccess();
      onClose();
    },
    successToast: t('common.Create Success'),
    errorToast: t('common.Create Failed')
  });

  return (
    <MyModal
      iconSrc="/imgs/module/ai.svg"
      title={t('user.Manage.Create User')}
      isOpen
      onClose={onClose}
      isCentered={!isPc}
    >
      <ModalBody>
        <Box color={'myGray.800'} fontWeight={'bold'}>
          {t('common.Set Name')}
        </Box>
        <Flex mt={3} alignItems={'center'}>
          <MyTooltip label={t('common.Set Avatar')}>
            <Avatar
              flexShrink={0}
              src={getValues('avatar')}
              w={['28px', '32px']}
              h={['28px', '32px']}
              cursor={'pointer'}
              borderRadius={'md'}
              onClick={onOpenSelectFile}
            />
          </MyTooltip>
          <Input
            flex={1}
            ml={4}
            autoFocus
            bg={'myWhite.600'}
            {...register('username', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex mt={3} alignItems={'center'}>
          <Text w={'80px'}>{t('user.Edit.Password')}</Text>
          <Input
            flex={1}
            ml={4}
            type={'password'}
            autoFocus
            bg={'myWhite.600'}
            {...register('password', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex mt={3} alignItems={'center'}>
          <Text w={'80px'}>{t('user.Edit.Balance')}</Text>
          <Input
            flex={1}
            ml={4}
            bg={'myWhite.600'}
            {...register('balance', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex mt={3} alignItems={'center'}>
          <Text w={'80px'}>{t('user.Edit.Promotion Rate')}</Text>
          <Input
            flex={1}
            ml={4}
            bg={'myWhite.600'}
            {...register('promotionRate', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex mt={3} alignItems={'center'}>
          <Text w={'80px'}>{t('user.Edit.Status')}</Text>
          <Box flex={1} ml={4} w={'100%'}>
            <MySelect
              bg={'myWhite.600'}
              list={userStatus}
              value={selectedStatus}
              onchange={(e) => {
                setSelectedStatus(e);
              }}
              {...register('status', {
                required: t('core.app.error.App name can not be empty')
              })}
            />
          </Box>
        </Flex>
        <Flex mt={3} alignItems={'center'}>
          <Text w={'80px'}>{t('user.Edit.Role')}</Text>
          <Box flex={1} ml={4} w={'100%'}>
            <MySelect
              bg={'myWhite.600'}
              list={TeamMemberRoles}
              value={selectedRole}
              onchange={(e) => {
                setSelectedRole(e);
              }}
              {...register('role', {
                required: t('core.app.error.App name can not be empty')
              })}
            />
          </Box>
        </Flex>
      </ModalBody>

      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common.Close')}
        </Button>
        <Button isLoading={creating} onClick={handleSubmit((data) => onclickCreate(data))}>
          {t('common.Confirm Create')}
        </Button>
      </ModalFooter>

      <File onSelect={onSelectFile} />
    </MyModal>
  );
};

export default CreateModal;
