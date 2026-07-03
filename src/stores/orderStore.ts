import { create } from 'zustand';

export interface Order {
  id?: number;
  order_number: string;
  product_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  status: 'PENDING_PAYMENT' | 'PAYMENT_COMPLETED' | 'PREPARING_SHIPMENT' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
  }>;
  shipping: {
    receiver_name: string;
    receiver_phone: string;
    zipcode: string;
    address: string;
    detail_address: string;
    delivery_request: string;
  };
  coupon_discount?: number;
}

interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  setCurrentOrder: (order: Order | null) => void;
  addOrder: (order: Order) => void;
  getOrder: (orderId: number) => Order | null;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: null,
  orders: [],
  setCurrentOrder: (order) => set({ currentOrder: order }),
  addOrder: (order) => {
    set((state) => ({
      orders: [...state.orders, { ...order, id: state.orders.length + 1 }],
    }));
  },
  getOrder: (orderId: number) => {
    return get().orders.find((o) => o.id === orderId) || null;
  },
}));
