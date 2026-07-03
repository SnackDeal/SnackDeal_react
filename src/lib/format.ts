import type {
  OrderStatus,
  ShippingStatus,
  PaymentStatus,
  MemberStatus,
  ProductStatus,
  UserCouponStatus,
  QnaType,
} from '@/types';

/** 원화 포맷: 12000 → "12,000원" */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

/** ISO 문자열 → "YYYY.MM.DD" */
export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

// enum → 한글 라벨 매핑 (DB enum 대문자 그대로 key)
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제대기',
  PAYMENT_COMPLETED: '결제완료',
  PREPARING_SHIPMENT: '배송준비중',
  SHIPPED: '배송중',
  COMPLETED: '배송완료',
  CANCELLED: '취소',
  REFUND_REQUESTED: '환불요청',
  REFUND_COMPLETED: '환불완료',
};

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  READY: '준비',
  PREPARING: '상품준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  READY: '결제전',
  PAID: '결제완료',
  FAILED: '실패',
  CANCELLED: '취소',
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: '정상',
  INACTIVE: '휴면',
  DELETED: '탈퇴',
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: '판매중',
  INACTIVE: '판매중지',
  DELETED: '삭제',
};

export const USER_COUPON_STATUS_LABEL: Record<UserCouponStatus, string> = {
  ACTIVE: '사용가능',
  USED: '사용완료',
  EXPIRED: '만료',
};

export const QNA_TYPE_LABEL: Record<QnaType, string> = {
  ORDER: '주문',
  SHIPPING: '배송',
  PRODUCT: '상품',
  OTHER: '기타',
};
