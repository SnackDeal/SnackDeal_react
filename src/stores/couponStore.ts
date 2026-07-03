import { create } from 'zustand';

export interface Coupon {
  id: number;
  name: string;
  discount_type: 'FIXED' | 'PERCENT';
  discount_value: number;
  min_order_price: number;
  valid_from: string;
  valid_until: string;
  total_quantity: number;
  issued_quantity: number;
  issue_type: 'EVENT' | 'SIGNIN';
  is_active: boolean;
}

export interface UserCoupon {
  id: number;
  coupon_id: number;
  coupon: Coupon;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  issued_at: string;
  used_at?: string;
}

export interface CouponBoard {
  id: number;
  title: string;
  content: string;
  thumbnail_url: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
}

const COUPONS: Coupon[] = [
  {
    id: 1,
    name: '신규가입 5,000원 할인',
    discount_type: 'FIXED',
    discount_value: 5000,
    min_order_price: 10000,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    total_quantity: 1000,
    issued_quantity: 500,
    issue_type: 'SIGNIN',
    is_active: true,
  },
  {
    id: 2,
    name: '여름 세일 20% 할인',
    discount_type: 'PERCENT',
    discount_value: 20,
    min_order_price: 30000,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    total_quantity: 500,
    issued_quantity: 120,
    issue_type: 'EVENT',
    is_active: true,
  },
  {
    id: 3,
    name: '배송료 무료 쿠폰',
    discount_type: 'FIXED',
    discount_value: 3000,
    min_order_price: 20000,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_quantity: 2000,
    issued_quantity: 800,
    issue_type: 'EVENT',
    is_active: true,
  },
];

const COUPON_BOARDS: CouponBoard[] = [
  {
    id: 1,
    title: '여름 대세일 쿠폰 받기',
    content: '이번 여름 최대 20% 할인 쿠폰을 받아보세요!',
    thumbnail_url: 'https://via.placeholder.com/300x200?text=Summer+Sale',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: '무료배송 쿠폰',
    content: '20,000원 이상 구매 시 배송료 무료!',
    thumbnail_url: 'https://via.placeholder.com/300x200?text=Free+Shipping',
    is_active: true,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface CouponState {
  userCoupons: UserCoupon[];
  addUserCoupon: (coupon: Coupon) => void;
  getUserCoupons: (status?: 'ACTIVE' | 'USED' | 'EXPIRED') => UserCoupon[];
  getCouponBoards: () => CouponBoard[];
  getCoupons: () => Coupon[];
}

let nextUserCouponId = 1;

export const useCouponStore = create<CouponState>((set, get) => ({
  userCoupons: [
    {
      id: nextUserCouponId++,
      coupon_id: 1,
      coupon: COUPONS[0],
      status: 'ACTIVE',
      issued_at: new Date().toISOString(),
    },
  ],

  addUserCoupon: (coupon) => {
    set((state) => ({
      userCoupons: [
        ...state.userCoupons,
        {
          id: nextUserCouponId++,
          coupon_id: coupon.id,
          coupon,
          status: 'ACTIVE',
          issued_at: new Date().toISOString(),
        },
      ],
    }));
  },

  getUserCoupons: (status) => {
    const coupons = get().userCoupons;
    if (!status) return coupons;
    return coupons.filter((uc) => uc.status === status);
  },

  getCouponBoards: () => COUPON_BOARDS,
  getCoupons: () => COUPONS,
}));
