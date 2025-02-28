import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import React, { useState } from 'react';
import { Box, Flex, Textarea } from '@chakra-ui/react';
import RowTabs from '@fastgpt/web/components/common/Tabs/RowTabs';
import MyTooltip from '@/components/MyTooltip';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import { InputDataType } from '@/pages/dataset/detail/components/InputDataModal';

enum InputTypeEnum {
  raw = 'raw',
  q = 'q',
  a = 'a'
}

enum EditModeEnum {
  add = 'add',
  edit = 'edit'
}

const InputTab = ({
  maxToken,
  register,
  setValue,
  mode
}: {
  maxToken: number;
  register: UseFormRegister<InputDataType>;
  setValue: UseFormSetValue<InputDataType>;
  mode: EditModeEnum;
}) => {
  const { t } = useTranslation();
  const { isPc } = useSystemStore();
  const [inputType, setInputType] = useState(InputTypeEnum.q);

  return (
    <Flex flexDirection={'column'} h={'100%'}>
      <Box>
        <RowTabs
          list={[
            {
              label: (
                <Flex alignItems={'center'}>
                  <Box as="span" color={'red.600'}>
                    *
                  </Box>
                  {t('core.dataset.data.Main Content')}
                  <MyTooltip label={t('core.dataset.data.Data Content Tip')}>
                    <QuestionOutlineIcon ml={1} />
                  </MyTooltip>
                </Flex>
              ),
              value: InputTypeEnum.q
            },
            {
              label: (
                <Flex alignItems={'center'}>
                  {t('core.dataset.data.Auxiliary Data')}
                  <MyTooltip label={t('core.dataset.data.Auxiliary Data Tip')}>
                    <QuestionOutlineIcon ml={1} />
                  </MyTooltip>
                </Flex>
              ),
              value: InputTypeEnum.a
            }
          ]}
          value={inputType}
          onChange={(e) => setInputType(e as InputTypeEnum)}
        />
      </Box>

      <Box mt={3} flex={'1 0 0'}>
        {inputType === InputTypeEnum.q && mode === EditModeEnum.add && (
          <Box h={'100%'}>
            <Textarea
              placeholder={t('core.dataset.data.Data Raw Content Placeholder', { maxToken })}
              maxLength={maxToken}
              h={'48%'}
              bg={'myWhite.400'}
              {...register(`raw`, {})}
              onChange={(e) => {
                setValue('q', e.target.value);
              }}
            />
            <Textarea
              placeholder={t('core.dataset.data.Data Content Placeholder', { maxToken })}
              maxLength={maxToken}
              h={'48%'}
              mt={'3'}
              bg={'myWhite.400'}
              {...register(`q`, {
                required: true
              })}
            />
          </Box>
        )}
        {inputType === InputTypeEnum.q && mode == EditModeEnum.edit && (
          <Textarea
            placeholder={t('core.dataset.data.Data Content Placeholder', { maxToken })}
            maxLength={maxToken}
            h={'100%'}
            bg={'myWhite.400'}
            {...register(`q`, {
              required: true
            })}
          />
        )}
        {inputType === InputTypeEnum.a && (
          <Textarea
            placeholder={t('core.dataset.data.Auxiliary Data Placeholder', {
              maxToken: maxToken * 1.5
            })}
            h={'100%'}
            bg={'myWhite.400'}
            rows={isPc ? 24 : 12}
            maxLength={maxToken * 1.5}
            {...register('a')}
          />
        )}
      </Box>
    </Flex>
  );
};
export default InputTab;
export { InputTab, EditModeEnum };
