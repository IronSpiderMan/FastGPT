import { Box, Card, Flex, Button } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import MyInput from '@/components/MyInput';
import MyPassword from '@/components/MyPassword';
import React, { useState, useCallback } from 'react';
import { postUser } from '@/web/support/user/api';
import { useToast } from '@fastgpt/web/hooks/useToast';

const ManageUser = () => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const { toast } = useToast();
  const onclickAdd = useCallback(async () => {
    try {
      const user = await postUser(inputValue, passwordValue);
      toast({
        title: '添加成功',
        status: 'success'
      });
    } catch (err: any) {
      console.log(err);
      toast({
        title: err.message,
        status: 'error'
      });
    }
    // const user = await postUser(inputValue, passwordValue);
    // toast({
    //   title: '添加成功',
    //   status: 'success'
    // });
    // console.log(user);
  }, [inputValue, passwordValue]);
  return (
    <Box py={[3, '28px']} px={['5vw', '64px']}>
      <Flex alignItems={'center'} fontSize={'xl'} h={'30px'}>
        <MyIcon mr={2} name={'support/user/userLight'} w={'20px'} />
        {t('support.account.ManageUser.Add User')}
      </Flex>

      <Card mt={6} px={[3, 10]} py={[3, 7]}>
        <Flex alignItems={'center'} w={['85%', '350px']}>
          <Box flex={'0 0 80px'}>{t('support.account.ManageUser.Username')}:&nbsp;</Box>
          <Box flex={'1 0 0'}>
            <MyInput value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
          </Box>
        </Flex>
        <Flex mt={6} alignItems={'center'} w={['85%', '350px']}>
          <Box flex={'0 0 80px'}>{t('support.account.ManageUser.Password')}:&nbsp;</Box>
          <Box flex={'1 0 0'}>
            <MyPassword value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} />
          </Box>
        </Flex>
        <Flex mt={6} alignItems={'center'} w={['85%', '350px']}>
          {/*<Box flex={'0 0 80px'}>{t('user.Timezone')}:&nbsp;</Box>*/}
          <Box flex={'1 0 0'}>
            <Button onClick={onclickAdd}>{t('user.Add User')}</Button>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
};
export default ManageUser;
