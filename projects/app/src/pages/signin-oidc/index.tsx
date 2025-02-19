// import Loading from "@/components/Loading";
// import {GetServerSideProps} from "next";
//
// const SigninOidc = () => {
//     return <Loading/>
// }
//
// export default SigninOidc;

// export const getServerSideProps: GetServerSideProps = async ({query}) => {
//     const {code, state} = query
//     return {
//         redirect: {
//             destination: `/api/auth/signin-oidc?code=${code}&state=${state}`,
//             permanent: false,
//         }
//     }
// }

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Loading from '@/components/Loading';
import { signinOidc } from '@/web/common/sso/api';
import { ResLogin } from '@/global/support/api/userRes';
import { useChatStore } from '@/web/core/chat/storeChat';
import { useUserStore } from '@/web/support/user/useUserStore';
import { setIdToken, setToken } from '@/web/support/user/auth';
import { AxiosError } from 'axios';
import { useToast } from '@fastgpt/web/hooks/useToast';

const SigninOidc = () => {
  const router = useRouter();
  const { setLastChatId, setLastChatAppId } = useChatStore();
  const { setUserInfo } = useUserStore();
  const { toast } = useToast();

  useEffect(() => {
    const { code, state } = router.query;
    if (code && state) {
      signinOidc({
        code: code as string,
        state: state as string
      })
        .then((res: ResLogin) => {
          // init store
          setLastChatId('');
          setLastChatAppId('');

          setUserInfo(res.user);
          setToken(res.token);
          setIdToken(res.id_token || '');
          setTimeout(() => {
            router.push('/');
          }, 300);
        })
        .catch((error: AxiosError) => {
          console.error(error.code);
          toast({
            title: '登录失败，请使用账号登录',
            status: 'error',
            duration: 1000
          });
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        });
    }
  }, [router.query, router, setLastChatId, setLastChatAppId, setUserInfo]);
  return <Loading />;
};

export default SigninOidc;
