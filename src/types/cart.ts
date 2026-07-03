import type { ID, ISODate } from './common';

// cart_item 테이블 — 옵션 없음 → member+product 단위
export interface CartItem {
  id: ID;
  quantity: number;
  member_id: ID;
  product_id: ID;
  created_at: ISODate;
  updated_at: ISODate;
}
