import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeliveryAddress {
  id: number;
  name: string;
  receiver_name: string;
  receiver_phone: string;
  zipcode: string;
  address: string;
  detail_address: string;
  is_default: boolean;
  created_at: string;
}

interface DeliveryState {
  addresses: DeliveryAddress[];
  addAddress: (addr: Omit<DeliveryAddress, 'id' | 'created_at'>) => void;
  updateAddress: (id: number, addr: Partial<DeliveryAddress>) => void;
  deleteAddress: (id: number) => { ok: true } | { ok: false; code: 'DEFAULT_CANNOT_BE_DELETED' };
  setDefaultAddress: (id: number) => void;
  getDefaultAddress: () => DeliveryAddress | null;
}

function nextIdFor(list: DeliveryAddress[]): number {
  return list.reduce((m, a) => (a.id > m ? a.id : m), 0) + 1;
}

/** 회원당 기본 배송지는 1개만 유지 — 여러 개가 있으면 마지막 하나만 남기고, 하나도 없고 목록이 있으면 첫 번째를 기본으로 승격. */
function normalizeDefaults(list: DeliveryAddress[]): DeliveryAddress[] {
  if (list.length === 0) return list;
  const defaults = list.filter((a) => a.is_default);
  if (defaults.length === 1) return list;
  const keepId = defaults.length > 1 ? defaults[defaults.length - 1]!.id : list[0]!.id;
  return list.map((a) => ({ ...a, is_default: a.id === keepId }));
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: (addr) => {
        set((state) => {
          // 첫 배송지는 요청값과 무관하게 무조건 기본 배송지
          const isFirst = state.addresses.length === 0;
          const newDefault = isFirst || addr.is_default;
          const existing = newDefault
            ? state.addresses.map((a) => ({ ...a, is_default: false }))
            : state.addresses;
          const next = [
            ...existing,
            {
              id: nextIdFor(state.addresses),
              created_at: new Date().toISOString(),
              ...addr,
              is_default: newDefault,
            },
          ];
          return { addresses: normalizeDefaults(next) };
        });
      },

      updateAddress: (id, updates) => {
        set((state) => {
          const next = updates.is_default
            ? state.addresses.map((a) =>
                a.id === id
                  ? { ...a, ...updates, is_default: true }
                  : { ...a, is_default: false }
              )
            : state.addresses.map((a) => (a.id === id ? { ...a, ...updates } : a));
          return { addresses: normalizeDefaults(next) };
        });
      },

      deleteAddress: (id) => {
        const target = get().addresses.find((a) => a.id === id);
        // 기본 배송지는 삭제 불가 (409 DELIVERY_DEFAULT_CANNOT_BE_DELETED)
        if (target?.is_default) {
          return { ok: false as const, code: 'DEFAULT_CANNOT_BE_DELETED' as const };
        }
        set((state) => ({
          addresses: normalizeDefaults(state.addresses.filter((a) => a.id !== id)),
        }));
        return { ok: true as const };
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: normalizeDefaults(
            state.addresses.map((a) => ({
              ...a,
              is_default: a.id === id,
            }))
          ),
        }));
      },

      getDefaultAddress: () => {
        const addr = get().addresses.find((a) => a.is_default);
        return addr || null;
      },
    }),
    {
      name: 'delivery-storage',
      version: 3,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<DeliveryState>;
        return {
          ...state,
          addresses: normalizeDefaults(state.addresses ?? []),
        } as DeliveryState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // 저장돼 있던 이상 상태 정규화 + 중복 id 재부여
        const seen = new Set<number>();
        let maxId = state.addresses.reduce((m, a) => (a.id > m ? a.id : m), 0);
        const deduped = state.addresses.map((a) => {
          if (seen.has(a.id)) {
            maxId += 1;
            const fixed = { ...a, id: maxId };
            seen.add(maxId);
            return fixed;
          }
          seen.add(a.id);
          return a;
        });
        state.addresses = normalizeDefaults(deduped);
      },
    }
  )
);
