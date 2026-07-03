import type { Order, OrderItem, Shipping, Payment, Delivery } from '@/types';

export const orders: Order[] = [
  {
    id: 1,
    order_number: 'SD20260702-0001',
    product_amount: 5300,
    shipping_fee: 3000,
    discount_amount: 2000,
    final_amount: 6300,
    status: 'SHIPPED',
    member_id: 1,
    user_coupon_id: 1,
    cancelled_at: null,
    created_at: '2026-07-02T13:20:00',
  },
  {
    id: 2,
    order_number: 'SD20260630-0007',
    product_amount: 9000,
    shipping_fee: 0,
    discount_amount: 0,
    final_amount: 9000,
    status: 'COMPLETED',
    member_id: 1,
    user_coupon_id: null,
    cancelled_at: null,
    created_at: '2026-06-30T09:05:00',
  },
];

export const orderItems: OrderItem[] = [
  { id: 1, product_name: '허니버터 감자칩', price: 1800, quantity: 1, product_id: 1, order_id: 1 },
  { id: 2, product_name: '과일 젤리 믹스', price: 2500, quantity: 1, product_id: 3, order_id: 1 },
  { id: 3, product_name: '버터 쿠키 12입', price: 4500, quantity: 2, product_id: 4, order_id: 2 },
];

export const shippings: Shipping[] = [
  {
    id: 1,
    receiver_name: '김스낵',
    receiver_phone: '010-1234-5678',
    zipcode: '06236',
    address: '서울 강남구 테헤란로 123',
    detail_address: '4층',
    delivery_request: '문 앞에 놓아주세요',
    courier: 'CJ대한통운',
    tracking_number: '1234567890',
    status: 'SHIPPING',
    order_id: 1,
  },
];

export const payments: Payment[] = [
  {
    id: 1,
    imp_uid: 'imp_1234567890',
    merchant_uid: 'SD20260702-0001',
    amount: 6300,
    pay_method: 'card',
    pg_provider: 'tosspayments',
    status: 'PAID',
    receipt_url: null,
    order_id: 1,
  },
];

// delivery = 재사용 주소록
export const deliveries: Delivery[] = [
  {
    id: 1,
    name: '집',
    receiver_name: '김스낵',
    receiver_phone: '010-1234-5678',
    zipcode: '06236',
    address: '서울 강남구 테헤란로 123',
    detail_address: '4층',
    is_default: true,
    member_id: 1,
  },
  {
    id: 2,
    name: '회사',
    receiver_name: '김스낵',
    receiver_phone: '010-1234-5678',
    zipcode: '04524',
    address: '서울 중구 세종대로 110',
    detail_address: '10층',
    is_default: false,
    member_id: 1,
  },
];
