import { Box, Button, Flex, Input, Textarea, useTheme } from '@chakra-ui/react';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useTranslation } from 'next-i18next';
import { useAssistantStore } from '@/web/core/assistant/store/useAssistantStore';
import { useForm } from 'react-hook-form';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import React, { useCallback, useEffect } from 'react';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@/components/MyTooltip';
import Avatar from '@/components/Avatar';
import { useRouter } from 'next/router';
import { useLoading } from '@/web/common/hooks/useLoading';
import type { UserType } from '@fastgpt/global/support/user/type';
import { AssistantDetailType } from '@fastgpt/global/core/assistant/type';

type FormType = {
  avatar: string;
  name: string;
  title: string;
  intro: string;
  projectId: string;
};

const AssistantInfo = () => {
  const theme = useTheme();
  const { setIsLoading } = useLoading();
  const { t } = useTranslation();
  const { assistantDetail, updateAssistantDetail } = useAssistantStore();
  const { isPc } = useSystemStore();
  const {
    reset,
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { isDirty }
  } = useForm<FormType>({
    defaultValues: {
      avatar: '/icon/logo.svg',
      name: assistantDetail?.name,
      title: assistantDetail?.title,
      intro: assistantDetail?.intro,
      projectId: assistantDetail?.projectId
    }
  });
  const router = useRouter();
  const { assistantId } = router.query as { assistantId: string };
  const { toast } = useToast();
  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });
  const onclickSave = useCallback(
    async (data: AssistantDetailType) => {
      await updateAssistantDetail(assistantId, {
        avatar: data.avatar
      });
      reset(data);
      toast({
        title: '更新数据成功',
        status: 'success'
      });
    },
    [reset, toast, updateAssistantDetail]
  );

  useEffect(() => {
    setValue('avatar', assistantDetail.avatar);
    setValue('name', assistantDetail.name);
    setValue('title', assistantDetail.title);
    setValue('intro', assistantDetail.intro);
    setValue('projectId', assistantDetail.projectId);
  }, [assistantDetail, setValue]);

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file || !assistantDetail) return;
      try {
        const src = await compressImgFileAndUpload({
          type: MongoImageTypeEnum.assistantAvatar,
          file,
          maxW: 300,
          maxH: 300
        });

        await onclickSave({
          ...assistantDetail,
          avatar: src
        });
      } catch (err: any) {
        toast({
          title: typeof err === 'string' ? err : t('common.error.Select avatar failed'),
          status: 'warning'
        });
      }
    },
    [onclickSave, t, toast, assistantDetail]
  );

  const onSubmit = async (data: FormType) => {
    await updateAssistantDetail(assistantId, data);
    toast({
      title: t('common.success.Update successful'),
      status: 'success'
    });
    setTimeout(() => {
      router.push('/assistant/list');
    });
  };
  return (
    <Box mt={6}>
      {isPc && (
        <Flex alignItems={'center'} fontSize={'xl'} h={'30px'}>
          <MyIcon mr={2} name={'support/user/userLight'} w={'20px'} />
          {t('assistant.Info')}
        </Flex>
      )}
      <Box mt={[0, 6]}>
        {isPc ? (
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
                <Avatar src={assistantDetail?.avatar} borderRadius={'50%'} w={'100%'} h={'100%'} />
              </Box>
            </MyTooltip>
          </Flex>
        ) : (
          <Flex
            flexDirection={'column'}
            alignItems={'center'}
            cursor={'pointer'}
            onClick={onOpenSelectFile}
          >
            <MyTooltip label={'更换头像'}>
              <Box
                w={['44px', '54px']}
                h={['44px', '54px']}
                borderRadius={'50%'}
                border={theme.borders.base}
                overflow={'hidden'}
                p={'2px'}
                boxShadow={'0 0 5px rgba(0,0,0,0.1)'}
                mb={2}
              >
                <Avatar src={assistantDetail?.avatar} borderRadius={'50%'} w={'100%'} h={'100%'} />
              </Box>
            </MyTooltip>

            <Flex alignItems={'center'} fontSize={'sm'} color={'myGray.600'}>
              <MyIcon mr={1} name={'edit'} w={'14px'} />
              {t('user.Replace')}
            </Flex>
          </Flex>
        )}
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('assistant.edit.Name')}:&nbsp;</Box>
          <Input
            flex={1}
            autoFocus
            w={'lg'}
            bg={'myWhite.600'}
            {...register('name', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('assistant.edit.Title')}:&nbsp;</Box>
          <Input
            flex={1}
            bg={'myWhite.600'}
            {...register('title', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('assistant.edit.ProjectId')}:&nbsp;</Box>
          <Input
            flex={1}
            bg={'myWhite.600'}
            {...register('intro', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Box flex={'0 0 80px'}>{t('assistant.edit.Intro')}:&nbsp;</Box>
          <Textarea
            flex={1}
            bg={'myWhite.600'}
            {...register('projectId', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Flex alignItems={'center'} mt={6}>
          <Button type="submit" flex={1} isDisabled={!isDirty} onClick={handleSubmit(onSubmit)}>
            确认修改
          </Button>
        </Flex>
      </Box>
      <File onSelect={onSelectFile} />
    </Box>
  );
};
export default React.memo(AssistantInfo);
