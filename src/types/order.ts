import type { ID, ISODate } from './common';

// orders 테이블
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_COMPLETED'
  | 'PREPARING_SHIPMENT'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUND_COMPLETED';

export interface Order {
  id: ID;
  order_number: string; // UNIQUE
  product_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  member_id: ID;
  user_coupon_id: ID | null;
  cancelled_at: ISODate | null;
  created_at: ISODate;
}

// order_item 테이블 — 스냅샷
export interface OrderItem {
  id: ID;
  product_name: string; // 스냅샷
  price: number;
  quantity: number;
  product_id: ID;
  order_id: ID;
}

// shipping 테이블 — 주문별 배송 스냅샷 (order_id UNIQUE)
export type ShippingStatus = 'READY' | 'PREPARING' | 'SHIPPING' | 'DELIVERED';

export interface Shipping {
  id: ID;
  receiver_name: string;
  receiver_phone: string;
  zipcode: string;
  address: string;
  detail_address: string;
  delivery_request: string | null;
  courier: string | null;
  tracking_number: string | null;
  status: ShippingStatus;
  order_id: ID;
}

// payment 테이블 (order_id UNIQUE) — 포트원 → 토스페이먼츠
export type PaymentStatus = 'READY' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Payment {
  id: ID;
  imp_uid: string;
  merchant_uid: string;
  amount: number;
  pay_method: string;
  pg_provider: 'tosspayments';
  status: PaymentStatus;
  receipt_url: string | null;
  order_id: ID;
}

// delivery 테이블 — 재사용 주소록 (order의 shipping 스냅샷과 별개)
export interface Delivery {
  id: ID;
  name: string; // 배송지 별칭 (예: 집, 회사)
  receiver_name: string;
  receiver_phone: string;
  zipcode: string;
  address: string;
  detail_address: string;
  is_default: boolean;
  member_id: ID;
}
