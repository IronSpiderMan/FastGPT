import React, { useState } from 'react';
import { Box, Flex, Button, useDisclosure } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { useTranslation } from 'next-i18next';
import PageContainer from '@/components/PageContainer';
import CreateModal from './components/CreateModal';
import UserTable from '@/pages/user/list/components/UserTable';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/web/support/user/api';

const Users = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal
  } = useDisclosure();
  const { refetch } = useQuery(['getUsers'], () => getUsers());
  return (
    <PageContainer isLoading={isLoading} insertProps={{ px: [5, '48px'] }}>
      <Flex pt={[4, '30px']} alignItems={'center'} justifyContent={'space-between'}>
        <Box letterSpacing={1} fontSize={['20px', '24px']} color={'myGray.900'}>
          {t('user.Manage User')}
        </Box>
        <Button leftIcon={<AddIcon />} variant={'primaryOutline'} onClick={onOpenCreateModal}>
          {t('common.New Create')}
        </Button>
      </Flex>
      <Box mt={6}>
        <UserTable isLoading={isLoading} setIsLoading={setIsLoading} />
      </Box>
      {isOpenCreateModal && (
        <CreateModal
          onClose={onCloseCreateModal}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}

export default Users;
