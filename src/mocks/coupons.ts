import type { CouponBoard, Coupon, UserCoupon } from '@/types';

export const couponBoards: CouponBoard[] = [
  {
    id: 1,
    title: '여름맞이 스낵 페스타',
    content: '여름 한정 쿠폰을 받아가세요!',
    thumbnail_url: null,
    is_active: true,
    start_at: '2026-07-01T00:00:00',
    end_at: '2026-07-31T23:59:59',
  },
];

export const coupons: Coupon[] = [
  {
    id: 1,
    name: '2,000원 할인 쿠폰',
    discount_type: 'FIXED',
    discount_value: 2000,
    min_order_price: 10000,
    valid_from: '2026-07-03T00:00:00',
    valid_until: '2026-07-31T23:59:59',
    total_quantity: 500,
    issued_quantity: 132,
    issue_type: 'EVENT',
    is_active: true,
    coupon_board_id: 1,
  },
  {
    id: 2,
    name: '신규가입 10% 할인',
    discount_type: 'PERCENT',
    discount_value: 10,
    min_order_price: 5000,
    valid_from: '2026-01-01T00:00:00',
    valid_until: '2026-12-31T23:59:59',
    total_quantity: 100000,
    issued_quantity: 4210,
    issue_type: 'SIGNIN',
    is_active: true,
    coupon_board_id: null, // SIGNIN → null 허용
  },
];

export const userCoupons: UserCoupon[] = [
  {
    id: 1,
    member_id: 1,
    coupon_id: 1,
    status: 'ACTIVE',
    issued_at: '2026-07-03T10:00:00',
    used_at: null,
  },
  {
    id: 2,
    member_id: 1,
    coupon_id: 2,
    status: 'USED',
    issued_at: '2026-05-01T10:00:00',
    used_at: '2026-06-30T09:05:00',
  },
];
