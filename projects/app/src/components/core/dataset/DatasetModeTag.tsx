import { Box, Flex, FlexProps } from '@chakra-ui/react';
import { DatasetModeMap } from '@fastgpt/global/core/dataset/constants';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import React from 'react';
import { DatasetModeEnum } from '@fastgpt/global/support/permission/constant';

const DatasetModeTag = ({ mode, ...props }: { mode: `${DatasetModeEnum}` } & FlexProps) => {
  const { t } = useTranslation();

  const item = DatasetModeMap[mode] || DatasetModeMap['vague'];

  return (
    <Flex
      bg={'myGray.100'}
      borderWidth={'1px'}
      borderColor={'myGray.200'}
      px={4}
      py={'6px'}
      borderRadius={'md'}
      fontSize={'xs'}
      {...props}
    >
      <MyIcon name={item.icon as any} w={'16px'} mr={2} color={'myGray.400'} />
      <Box>{t(item.label)}</Box>
    </Flex>
  );
};

export default DatasetModeTag;
