import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserUpdateParams } from '@/types/user';
import type { UserListItemType, UserType } from '@fastgpt/global/support/user/type.d';
import { getTokenLogin, putUserInfo } from '@/web/support/user/api';
import { FeTeamPlanStatusType } from '@fastgpt/global/support/wallet/sub/type';
import { getTeamPlanStatus } from './team/api';
import { getUsers, putUser, getUserById } from '@/web/support/user/api';
import { UpdateUserParams } from '@fastgpt/global/support/user/api';

type State = {
  users: UserListItemType[];
  loadUsers: (init?: boolean) => Promise<UserListItemType[]>;
  userInfo: UserType | null;
  userDetail: UpdateUserParams;
  loadUserDetail: (id: string, init?: boolean) => Promise<UserListItemType>;
  updateUserDetail(data: UpdateUserParams): Promise<void>;
  initUserInfo: () => Promise<UserType>;
  setUserInfo: (user: UserType | null) => void;
  updateUserInfo: (user: UserUpdateParams) => Promise<void>;
  teamPlanStatus: FeTeamPlanStatusType | null;
  initTeamPlanStatus: () => Promise<any>;
};

export const useUserStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        userInfo: null,
        users: [],
        userDetail: null,
        async loadUsers(init = true) {
          if (get().users.length > 0 && !init) return [];
          const res = await getUsers();
          set((state) => {
            state.users = res;
          });
          return res;
        },
        async initUserInfo() {
          get().initTeamPlanStatus();

          const res = await getTokenLogin();
          get().setUserInfo(res);

          //设置html的fontsize
          const html = document?.querySelector('html');
          if (html) {
            // html.style.fontSize = '16px';
          }

          return res;
        },
        setUserInfo(user: UserType | null) {
          set((state) => {
            state.userInfo = user ? user : null;
          });
        },
        async updateUserInfo(user: UserUpdateParams) {
          const oldInfo = (get().userInfo ? { ...get().userInfo } : null) as UserType | null;
          set((state) => {
            if (!state.userInfo) return;
            state.userInfo = {
              ...state.userInfo,
              ...user
            };
          });
          try {
            await putUserInfo(user);
          } catch (error) {
            set((state) => {
              state.userInfo = oldInfo;
            });
            return Promise.reject(error);
          }
        },
        async loadUserDetail(id: string, init = false) {
          if (id === get().userDetail._id && !init) return get().userDetail;
          const res = await getUserById(id);
          set((state) => {
            state.userDetail = res;
          });
          return res;
        },
        async updateUserDetail(data: UpdateUserParams) {
          await putUser(data);
          set((state) => {
            state.userDetail = {
              ...state.userDetail,
              ...data
            };
          });
        },
        teamPlanStatus: null,
        initTeamPlanStatus() {
          return getTeamPlanStatus().then((res) => {
            set((state) => {
              state.teamPlanStatus = res;
            });
            return res;
          });
        }
      })),
      {
        name: 'userStore',
        partialize: (state) => ({})
      }
    )
  )
);
