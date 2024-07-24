import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getAssistants, getAssistantById, putAssistantById } from '@/web/core/assistant/api';
import { defaultAssistant } from '@/constants/assistant';
import type { AssistantUpdateParams } from '@fastgpt/global/core/assistant/api';
import { AssistantDetailType, AssistantListItemType } from '@fastgpt/global/core/assistant/type';

type State = {
  assistants: AssistantListItemType[];
  loadAssistants: (init?: boolean) => Promise<AssistantListItemType[]>;
  assistantDetail: AssistantDetailType;
  loadAssistantDetail: (id: string, init?: boolean) => Promise<AssistantDetailType>;
  updateAssistantDetail(appId: string, data: AssistantUpdateParams): Promise<void>;
  replaceAssistantDetail(appId: string, data: AssistantUpdateParams): Promise<void>;
  clearAssistantModules(): void;
};

export const useAssistantStore = create<State>()(
  devtools(
    persist(
      immer((set, get) => ({
        assistants: [],
        async loadAssistants(init = true) {
          if (get().assistants.length > 0 && !init) return [];
          const res = await getAssistants();
          set((state) => {
            state.assistants = res;
          });
          return res;
        },
        assistantDetail: defaultAssistant,
        async loadAssistantDetail(id: string, init = false) {
          if (id === get().assistantDetail._id && !init) return get().assistantDetail;

          const res = await getAssistantById(id);
          set((state) => {
            state.assistantDetail = res;
          });
          return res;
        },
        async updateAssistantDetail(assistantId: string, data: AssistantUpdateParams) {
          await putAssistantById(assistantId, data);
          set((state) => {
            state.assistantDetail = {
              ...state.assistantDetail,
              ...data
            };
          });
        }
      })),
      {
        name: 'assistantStore',
        partialize: (state) => ({})
      }
    )
  )
);
