import type { ID, ISODate } from './common';

// coupon_board 테이블 = 이벤트게시판 (게시/노출 기간)
export interface CouponBoard {
  id: ID;
  title: string;
  content: string;
  thumbnail_url: string | null;
  is_active: boolean;
  start_at: ISODate; // 게시일 = 이벤트가 화면에 보이기 시작
  end_at: ISODate;
}

// coupon 테이블
export type DiscountType = 'FIXED' | 'PERCENT';
export type IssueType = 'EVENT' | 'SIGNIN';

export interface Coupon {
  id: ID;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_price: number;
  valid_from: ISODate; // 받기 오픈일 = 다운로드가 열림
  valid_until: ISODate;
  total_quantity: number;
  issued_quantity: number;
  issue_type: IssueType;
  is_active: boolean;
  coupon_board_id: ID | null; // EVENT 필수 / SIGNIN null 허용
}

// user_coupon 테이블 — 회원 보유 쿠폰(쿠폰함)
export type UserCouponStatus = 'ACTIVE' | 'USED' | 'EXPIRED';

export interface UserCoupon {
  id: ID;
  member_id: ID;
  coupon_id: ID;
  status: UserCouponStatus;
  issued_at: ISODate;
  used_at: ISODate | null;
}
