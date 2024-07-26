import { useTranslation } from 'next-i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Flex,
  Input,
  ModalBody,
  ModalFooter,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useTheme
} from '@chakra-ui/react';
import Avatar from '@/components/Avatar';
import MyMenu from '@/components/MyMenu';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useMutation, useQuery } from '@tanstack/react-query';
import { delUserById, getUsers } from '@/web/support/user/api';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import MyTooltip from '@/components/MyTooltip';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyModal from '@/components/MyModal';
import { useUserStore } from '@/web/support/user/useUserStore';
import { UpdateUserParams } from '@fastgpt/global/support/user/api';
import MySelect from '@/components/Select';
import { userStatus } from '@fastgpt/global/support/user/constant';
import { TeamMemberRoles } from '@fastgpt/global/support/user/team/constant';

const UserTable = ({
  isLoading,
  setIsLoading
}: {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) => {
  const { t } = useTranslation();
  const [editData, setEditData] = useState<UpdateUserParams>();
  const { toast } = useToast();
  const { mutate: onclickRemove, isLoading: isDeleting } = useMutation({
    mutationFn: async (id: string) => delUserById(id),
    onSuccess() {
      refetch();
    },
    onError(err: Error) {
      toast({
        status: 'error',
        title: err.message
      });
    }
  });
  const { openConfirm, ConfirmModal } = useConfirm({
    type: 'delete'
  });
  const {
    data: users = [],
    isLoading: isGetting,
    refetch
  } = useQuery(['getUsers'], () => getUsers());
  useEffect(() => {
    setIsLoading(isGetting);
  }, [setIsLoading, isGetting]);
  useEffect(() => {
    setIsLoading(isDeleting);
  }, [setIsLoading, isDeleting]);
  return (
    <>
      <TableContainer mt={2} position={'relative'} minH={'300px'}>
        <Table>
          <Thead>
            <Tr>
              <Th>头像</Th>
              <Th>用户名</Th>
              <Th>balance</Th>
              <Th>promotionRate</Th>
              <Th>状态</Th>
              <Th>Openai账号</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody fontSize={'sm'}>
            {users.map(
              ({ _id, username, avatar, balance, promotionRate, status, openaiAccount, role }) => (
                <Tr key={_id}>
                  <Td>
                    <Avatar src={avatar} borderRadius={'md'} w={'28px'} />
                  </Td>
                  <Td>{username}</Td>
                  <Td>{balance}</Td>
                  <Td>{promotionRate}</Td>
                  <Td>{status}</Td>
                  <Td>{openaiAccount?.baseUrl}</Td>
                  <Td>
                    <MyMenu
                      offset={[-50, 5]}
                      Button={
                        <MyIcon
                          name={'more'}
                          w={'14px'}
                          p={2}
                          _hover={{ bg: 'myWhite.600  ' }}
                          cursor={'pointer'}
                          borderRadius={'md'}
                        />
                      }
                      menuList={[
                        {
                          label: t('common.Edit'),
                          icon: 'edit',
                          onClick: () =>
                            setEditData({
                              _id,
                              username,
                              avatar,
                              balance,
                              promotionRate,
                              status,
                              openaiAccount,
                              role,
                              password: ''
                            })
                        },
                        {
                          label: t('common.Delete'),
                          icon: 'delete',
                          // onClick: () => onclickRemove(_id)
                          onClick: () => {
                            openConfirm(() => onclickRemove(_id), undefined, '是否要删除用户')();
                          }
                        }
                      ]}
                    />
                  </Td>
                </Tr>
              )
            )}
          </Tbody>
        </Table>
      </TableContainer>
      <ConfirmModal />
      <MyModal
        isOpen={!!editData}
        onClose={() => {
          setEditData(undefined);
        }}
      >
        <ModalBody>
          {!!editData && (
            <EditUserModal
              userData={editData}
              onClose={() => {
                setEditData(undefined);
              }}
              onCreate={() => {}}
              onEdit={() => {}}
              refetch={refetch}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
            />
          )}
        </ModalBody>
        <ModalFooter></ModalFooter>
      </MyModal>
    </>
  );
};
export default React.memo(UserTable);

function EditUserModal({
  userData,
  onEdit,
  refetch,
  isLoading,
  setIsLoading,
  onClose
}: {
  userData: UpdateUserParams;
  onClose: () => void;
  onCreate: (id: string) => void;
  onEdit: () => void;
  refetch: () => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>(userData.status || '');
  const [selectedRole, setSelectedRole] = useState<string>(userData.role || '');
  const { t } = useTranslation();
  const { toast } = useToast();
  const theme = useTheme();
  const { updateUserDetail } = useUserStore();
  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });
  const {
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      ...userData,
      password: ''
    }
  });

  const onclickSave = useCallback(
    async (data: UpdateUserParams) => {
      setIsLoading(true);
      await updateUserDetail({
        _id: data._id,
        avatar: data.avatar
      });
      reset(data);
      toast({
        title: '更新数据成功',
        status: 'success'
      });
      refetch();
      setIsLoading(false);
      onClose();
    },
    [onClose, refetch, setIsLoading, reset, toast, updateUserDetail]
  );
  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file || !userData) return;
      try {
        const src = await compressImgFileAndUpload({
          type: MongoImageTypeEnum.userAvatar,
          file,
          maxW: 300,
          maxH: 300
        });
        await onclickSave({
          ...userData,
          avatar: src
        });
      } catch (err: any) {
        toast({
          title: typeof err === 'string' ? err : t('common.error.Select avatar failed'),
          status: 'warning'
        });
      }
    },
    [onclickSave, t, toast, userData]
  );

  // update user info
  const onSubmit = async (data: UpdateUserParams) => {
    setIsLoading(true);
    await updateUserDetail(data);
    toast({
      title: t('common.success.Update successful'),
      status: 'success'
    });
    onClose();
    refetch(); // 刷新数据
    setIsLoading(false);
  };
  return (
    <Box mt={6}>
      <Flex alignItems={'center'} fontSize={'xl'} h={'30px'}>
        <MyIcon mr={2} name={'support/user/userLight'} w={'20px'} />
        {t('user.Edit.Edit User')}
      </Flex>
      <Box mt={[0, 6]}>
        <Flex alignItems={'center'} cursor={'pointer'}>
          <Box flex={'0 0 80px'}>{t('support.user.Avatar')}:&nbsp;</Box>
          <MyTooltip label={t('common.avatar.Select Avatar')}>
            <Box
              w={['44px', '56px']}
              h={['44px', '56px']}
              borderRadius={'50%'}
              border={theme.borders.base}
              overflow={'hidden'}
              p={'2px'}
              boxShadow={'0 0 5px rgba(0,0,0,0.1)'}
              mb={2}
              onClick={onOpenSelectFile}
            >
              <Avatar src={userData?.avatar} borderRadius={'50%'} w={'100%'} h={'100%'} />
            </Box>
          </MyTooltip>
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.UserName')}:&nbsp;</Box>
          <Input
            flex={1}
            autoFocus
            w={'lg'}
            bg={'myWhite.600'}
            {...register('username', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.Password')}:&nbsp;</Box>
          <Input type={'password'} flex={1} bg={'myWhite.600'} {...register('password')} />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.Balance')}:&nbsp;</Box>
          <Input
            type={'number'}
            flex={1}
            bg={'myWhite.600'}
            {...register('balance', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.Promotion Rate')}:&nbsp;</Box>
          <Input
            type={'number'}
            flex={1}
            bg={'myWhite.600'}
            {...register('promotionRate', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.Status')}:&nbsp;</Box>
          <Box flex={1} w={'100%'}>
            <MySelect
              bg={'myWhite.600'}
              list={userStatus}
              value={selectedStatus}
              onchange={(e) => {
                setSelectedStatus(e);
                setValue('status', e);
              }}
              {...register('status', {
                required: t('core.app.error.App name can not be empty')
              })}
            />
          </Box>
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('user.Edit.Role')}:&nbsp;</Box>
          <Box flex={1} w={'100%'}>
            <MySelect
              bg={'myWhite.600'}
              list={TeamMemberRoles}
              value={selectedRole}
              onchange={(e) => {
                setSelectedRole(e);
                setValue('role', e);
              }}
              {...register('role', {
                required: t('core.app.error.App name can not be empty')
              })}
            />
          </Box>
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Button
            isLoading={isLoading}
            type="submit"
            flex={1}
            isDisabled={!isDirty}
            onClick={handleSubmit(onSubmit)}
          >
            确认修改
          </Button>
        </Flex>
      </Box>
      <File onSelect={onSelectFile} />
    </Box>
  );
}
