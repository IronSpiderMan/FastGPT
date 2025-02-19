import { serviceSideProps } from '@/web/common/utils/i18n';
import React, { useEffect } from 'react';
import Loading from '@/components/Loading';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

const index = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();

  useEffect(() => {
    if (userInfo?.team.role === TeamMemberRoleEnum.visitor) {
      router.push('/app/list');
    } else {
      router.push('/dataset/list');
    }
  }, [router, userInfo]);
  return <Loading></Loading>;
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
export default index;
