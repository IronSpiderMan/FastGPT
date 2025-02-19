import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Loading from '@/components/Loading';

const LogoutOidc = () => {
  const router = useRouter();
  useEffect(() => {
    if (router) {
      router.push('/login');
    }
  }, [router]);
  return <Loading />;
};

export default LogoutOidc;
