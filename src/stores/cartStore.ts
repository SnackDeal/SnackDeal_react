import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id?: number; // mock id
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  max_stock: number;
  is_soldout: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'product_name' | 'product_image' | 'max_stock' | 'is_soldout'> & { product_name?: string; product_image?: string; max_stock?: number; is_soldout?: boolean }) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  removeItems: (productIds: number[]) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            // 수량 합산
            const newQty = Math.min(
              existing.quantity + item.quantity,
              item.max_stock ?? existing.max_stock
            );
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: newQty }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: Date.now(),
                product_name: item.product_name || '',
                product_image: item.product_image || '',
                max_stock: item.max_stock ?? 999,
                is_soldout: item.is_soldout ?? false,
                ...item,
              },
            ],
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: Math.min(quantity, i.max_stock) }
              : i
          ),
        }));
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      removeItems: (productIds) => {
        set((state) => ({
          items: state.items.filter((i) => !productIds.includes(i.product_id)),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.length;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
