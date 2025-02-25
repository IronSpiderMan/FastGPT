import { Box, Grid } from '@chakra-ui/react';
import React, { useCallback } from 'react';

import { AppListItemType } from '@fastgpt/global/core/app/type';
import AppCard from '@/pages/app/list/component/AppCard';
import AppCard2 from '@/pages/app/list/component/AppCard2';

interface AppGroupProps {
  field: string;
  apps: AppListItemType[];
  onclickDelApp: (id: string) => Promise<void>;
}

const Field = ({ field, apps, onclickDelApp }: AppGroupProps) => {
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
        {apps.map((app, index) => (
          <AppCard2 key={index} app={app} onclickDelApp={onclickDelApp} />
        ))}
      </Grid>
    </Box>
  );
};
export default Field;
