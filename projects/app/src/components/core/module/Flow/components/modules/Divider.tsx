import React from 'react';
import { Box, useTheme } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

const Divider = ({ text }: { text?: 'Input' | 'Output' | string }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const isDivider = !text;

  return (
    <Box
      textAlign={'center'}
      bg={'#f8f8f8'}
      py={isDivider ? '0' : 2}
      borderTop={theme.borders.base}
      borderBottom={theme.borders.base}
      fontSize={'lg'}
    >
      {text ? t(`common.${text}`) : ''}
    </Box>
  );
};

export default React.memo(Divider);
