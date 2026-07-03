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
  deleteAddress: (id: number) => void;
  setDefaultAddress: (id: number) => void;
  getDefaultAddress: () => DeliveryAddress | null;
}

let nextId = 1;

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: (addr) => {
        set((state) => {
          let newDefault = addr.is_default;
          // 기본 배송지 지정 시 기존 기본 배송지 해제
          if (newDefault) {
            state.addresses = state.addresses.map((a) => ({
              ...a,
              is_default: false,
            }));
          }
          return {
            addresses: [
              ...state.addresses,
              {
                id: nextId++,
                created_at: new Date().toISOString(),
                ...addr,
                is_default: newDefault,
              },
            ],
          };
        });
      },

      updateAddress: (id, updates) => {
        set((state) => ({
          addresses: state.addresses.map((a) => {
            if (a.id === id) {
              let updated = { ...a, ...updates };
              // 기본 배송지 지정 시 기존 기본 배송지 해제
              if (updates.is_default) {
                state.addresses = state.addresses.map((x) => ({
                  ...x,
                  is_default: x.id === id,
                }));
              }
              return updated;
            }
            return a;
          }),
        }));
      },

      deleteAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        }));
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            is_default: a.id === id,
          })),
        }));
      },

      getDefaultAddress: () => {
        const addr = get().addresses.find((a) => a.is_default);
        return addr || null;
      },
    }),
    {
      name: 'delivery-storage',
    }
  )
);
