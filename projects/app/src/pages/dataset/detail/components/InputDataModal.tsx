import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Grid, Textarea, useTheme } from '@chakra-ui/react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  delOneDatasetDataById,
  getDatasetCollectionById,
  getDatasetDataItemById,
  postInsertData2Dataset,
  putDatasetDataById
} from '@/web/core/dataset/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyModal from '@/components/MyModal';
import MyTooltip from '@/components/MyTooltip';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useRequest } from '@/web/common/hooks/useRequest';
import { countPromptTokens } from '@fastgpt/global/common/string/tiktoken';
import { useConfirm } from '@/web/common/hooks/useConfirm';
import { getDefaultIndex } from '@fastgpt/global/core/dataset/utils';
import { DatasetDataIndexItemType } from '@fastgpt/global/core/dataset/type';
import SideTabs from '@/components/SideTabs';
import DeleteIcon from '@fastgpt/web/components/common/Icon/delete';
import { defaultCollectionDetail } from '@/constants/dataset';
import { getDocPath } from '@/web/common/system/doc';
import RawSourceBox from '@/components/core/dataset/RawSourceBox';
import MyBox from '@/components/common/MyBox';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { EditModeEnum, InputTab } from '@/pages/dataset/detail/components/InputTab';
import { postRefineContent } from '@/web/core/ai/api';

export type InputDataType = {
  raw: string;
  q: string;
  a: string;
  indexes: (Omit<DatasetDataIndexItemType, 'dataId'> & {
    dataId?: string; // pg data id
  })[];
};

enum TabEnum {
  content = 'content',
  index = 'index',
  delete = 'delete',
  doc = 'doc'
}

const InputDataModal = ({
  collectionId,
  dataId,
  defaultValue,
  onClose,
  onSuccess,
  onDelete
}: {
  collectionId: string;
  dataId?: string;
  defaultValue?: { raw?: string; q: string; a?: string };
  onClose: () => void;
  onSuccess: (data: InputDataType & { dataId: string }) => void;
  onDelete?: () => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState(TabEnum.content);
  const { vectorModelList } = useSystemStore();

  const { register, handleSubmit, reset, control, setValue, getValues } = useForm<InputDataType>();
  const {
    fields: indexes,
    append: appendIndexes,
    remove: removeIndexes
  } = useFieldArray({
    control,
    name: 'indexes'
  });

  const tabList = [
    { label: t('dataset.data.edit.Content'), id: TabEnum.content, icon: 'common/overviewLight' },
    {
      label: t('dataset.data.edit.Index', { amount: indexes.length }),
      id: TabEnum.index,
      icon: 'kbTest'
    },
    ...(dataId
      ? [{ label: t('dataset.data.edit.Delete'), id: TabEnum.delete, icon: 'delete' }]
      : [])
    // { label: t('dataset.data.edit.Course'), id: TabEnum.doc, icon: 'common/courseLight' }
  ];

  const { ConfirmModal, openConfirm } = useConfirm({
    content: t('dataset.data.Delete Tip'),
    type: 'delete'
  });

  const { data: collection = defaultCollectionDetail } = useQuery(
    ['loadCollectionId', collectionId],
    () => {
      return getDatasetCollectionById(collectionId);
    }
  );
  const { isFetching: isFetchingData } = useQuery(
    ['getDatasetDataItemById', dataId],
    () => {
      if (dataId) return getDatasetDataItemById(dataId);
      return null;
    },
    {
      onSuccess(res) {
        if (res) {
          reset({
            raw: res.raw,
            q: res.q,
            a: res.a,
            indexes: res.indexes
          });
        } else if (defaultValue) {
          reset({
            raw: defaultValue.raw,
            q: defaultValue.q,
            a: defaultValue.a
          });
        }
      },
      onError(err) {
        toast({
          status: 'error',
          title: t(getErrText(err))
        });
        onClose();
      }
    }
  );

  const maxToken = useMemo(() => {
    const vectorModel =
      vectorModelList.find((item) => item.model === collection.datasetId.vectorModel) ||
      vectorModelList[0];

    return vectorModel?.maxToken || 3000;
  }, [collection.datasetId.vectorModel, vectorModelList]);

  // import new data
  const { mutate: sureImportData, isLoading: isImporting } = useRequest({
    mutationFn: async (e: InputDataType) => {
      if (!e.q) {
        setCurrentTab(TabEnum.content);
        return Promise.reject(t('dataset.data.input is empty'));
      }
      if (countPromptTokens(e.q) >= maxToken) {
        return Promise.reject(t('core.dataset.data.Too Long'));
      }

      const data = { ...e };

      const dataId = await postInsertData2Dataset({
        collectionId: collection._id,
        raw: e.raw,
        q: e.q,
        a: e.a,
        // remove dataId
        indexes:
          e.indexes?.map((index) => ({
            ...index,
            dataId: undefined
          })) || []
      });

      return {
        ...data,
        dataId
      };
    },
    successToast: t('dataset.data.Input Success Tip'),
    onSuccess(e) {
      reset({
        ...e,
        raw: '',
        q: '',
        a: '',
        indexes: []
      });

      onSuccess(e);
    },
    errorToast: t('common.error.unKnow')
  });
  // update
  const { mutate: onUpdateData, isLoading: isUpdating } = useRequest({
    mutationFn: async (e: InputDataType) => {
      if (!dataId) return e;

      // not exactly same
      await putDatasetDataById({
        id: dataId,
        ...e,
        indexes:
          e.indexes?.map((index) =>
            index.defaultIndex ? getDefaultIndex({ q: e.q, a: e.a, dataId: index.dataId }) : index
          ) || []
      });

      return {
        dataId,
        ...e
      };
    },
    successToast: t('dataset.data.Update Success Tip'),
    errorToast: t('common.error.unKnow'),
    onSuccess(data) {
      onSuccess(data);
      onClose();
    }
  });
  // delete
  const { mutate: onDeleteData, isLoading: isDeleting } = useRequest({
    mutationFn: () => {
      if (!onDelete || !dataId) return Promise.resolve(null);
      return delOneDatasetDataById(dataId);
    },
    onSuccess() {
      if (!onDelete) return;
      onDelete();
      onClose();
    },
    successToast: t('common.Delete Success'),
    errorToast: t('common.error.unKnow')
  });

  // 添加 isRefining 状态
  const { mutate: handleRefine, isLoading: isRefining } = useRequest({
    mutationFn: async () => {
      const raw = getValues('raw');
      if (!raw) {
        return Promise.reject(); // 使用 Promise.reject 来避免后续的 successToast 和 onSuccess 被触发
      } else {
        return postRefineContent({ content: raw });
      }
    },
    successToast: t('core.dataset.data.Refine Success'),
    errorToast: t('core.dataset.data.Raw Data is Required'),
    onSuccess(data) {
      // 如果需要，可以更新表单的值
      setValue('q', data);
    }
  });

  const isLoading = useMemo(
    () => isImporting || isUpdating || isFetchingData || isDeleting,
    [isImporting, isUpdating, isFetchingData, isDeleting, isRefining]
  );

  return (
    <MyModal isOpen={true} isCentered w={'90vw'} maxW={'1440px'} h={'90vh'}>
      <MyBox isLoading={isLoading} display={'flex'} h={'100%'}>
        <Box p={5} borderRight={theme.borders.base}>
          <RawSourceBox
            w={'200px'}
            className="textEllipsis3"
            whiteSpace={'pre-wrap'}
            sourceName={collection.sourceName}
            sourceId={collection.sourceId}
            mb={6}
            fontSize={'sm'}
          />
          <SideTabs
            list={tabList}
            activeId={currentTab}
            onChange={async (e: any) => {
              if (e === TabEnum.delete) {
                return openConfirm(onDeleteData)();
              }
              if (e === TabEnum.doc) {
                return window.open(getDocPath('/docs/use-cases/datasetengine'), '_blank');
              }
              setCurrentTab(e);
            }}
          />
        </Box>
        <Flex flexDirection={'column'} py={3} flex={1} h={'100%'}>
          <Box fontSize={'lg'} px={5} fontWeight={'bold'} mb={4}>
            {currentTab === TabEnum.content && (
              <>{dataId ? t('dataset.data.Update Data') : t('dataset.data.Input Data')}</>
            )}
            {currentTab === TabEnum.index && <> {t('dataset.data.Index Edit')}</>}
          </Box>
          <Box flex={1} px={5} overflow={'auto'}>
            {currentTab === TabEnum.content && (
              <InputTab
                maxToken={maxToken}
                register={register}
                setValue={setValue}
                mode={dataId ? EditModeEnum.edit : EditModeEnum.add}
              />
            )}
            {currentTab === TabEnum.index && (
              <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gridGap={4}>
                {indexes?.map((index, i) => (
                  <Box
                    key={index.dataId || i}
                    p={3}
                    borderRadius={'md'}
                    border={theme.borders.base}
                    bg={i % 2 !== 0 ? 'myWhite.400' : ''}
                    _hover={{
                      '& .delete': {
                        display: index.defaultIndex ? 'none' : 'block'
                      }
                    }}
                  >
                    <Flex mb={1}>
                      <Box flex={1}>
                        {index.defaultIndex
                          ? t('dataset.data.Default Index')
                          : t('dataset.data.Custom Index Number', { number: i })}
                      </Box>
                      <DeleteIcon
                        onClick={() => {
                          if (indexes.length <= 1) {
                            appendIndexes(getDefaultIndex({ dataId: `${Date.now()}` }));
                          }
                          removeIndexes(i);
                        }}
                      />
                    </Flex>
                    {index.defaultIndex ? (
                      <Box>{t('core.dataset.data.Default Index Tip')}</Box>
                    ) : (
                      <Textarea
                        maxLength={maxToken}
                        rows={10}
                        borderColor={'transparent'}
                        px={0}
                        _focus={{
                          borderColor: 'primary.400',
                          px: 3
                        }}
                        placeholder={t('dataset.data.Index Placeholder')}
                        {...register(`indexes.${i}.text`, {
                          required: true
                        })}
                      />
                    )}
                  </Box>
                ))}
                <Flex
                  flexDirection={'column'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  borderRadius={'md'}
                  border={theme.borders.base}
                  cursor={'pointer'}
                  _hover={{
                    bg: 'primary.50'
                  }}
                  minH={'100px'}
                  onClick={() =>
                    appendIndexes({
                      defaultIndex: false,
                      text: '',
                      dataId: `${Date.now()}`
                    })
                  }
                >
                  <MyIcon name={'common/addCircleLight'} w={'16px'} />
                  <Box>{t('dataset.data.Add Index')}</Box>
                </Flex>
              </Grid>
            )}
          </Box>
          {/* footer */}
          <Flex px={5} mt={4}>
            <Flex justifyContent={'flex-start'} w={'50%'}>
              <MyTooltip label={collection.canWrite ? '' : t('dataset.data.Can not edit')}>
                <Button
                  isDisabled={!collection.canWrite || !!dataId}
                  onClick={handleRefine}
                  isLoading={isRefining}
                >
                  总结内容
                </Button>
              </MyTooltip>
            </Flex>
            <Flex justifyContent={'flex-end'} w={'50%'}>
              <Button variant={'whiteBase'} mr={3} onClick={onClose}>
                {t('common.Close')}
              </Button>
              <MyTooltip label={collection.canWrite ? '' : t('dataset.data.Can not edit')}>
                <Button
                  isDisabled={!collection.canWrite || isRefining}
                  // @ts-ignore
                  onClick={handleSubmit(dataId ? onUpdateData : sureImportData)}
                >
                  {dataId ? t('common.Confirm Update') : t('common.Confirm Import')}
                </Button>
              </MyTooltip>
            </Flex>
          </Flex>
          {/*<Flex justifyContent={'flex-end'} px={5} mt={4}>*/}
          {/*  <Button variant={'whiteBase'} mr={3} onClick={onClose}>*/}
          {/*    {t('common.Close')}*/}
          {/*  </Button>*/}
          {/*  </Button>*/}
          {/*  <MyTooltip label={collection.canWrite ? '' : t('dataset.data.Can not edit')}>*/}
          {/*    <Button*/}
          {/*      isDisabled={!collection.canWrite}*/}
          {/*      // @ts-ignore*/}
          {/*      onClick={handleSubmit(dataId ? onUpdateData : sureImportData)}*/}
          {/*    >*/}
          {/*      {dataId ? t('common.Confirm Update') : t('common.Confirm Import')}*/}
          {/*    </Button>*/}
          {/*  </MyTooltip>*/}
          {/*</Flex>*/}
        </Flex>
      </MyBox>
      <ConfirmModal />
    </MyModal>
  );
};

export default React.memo(InputDataModal);
