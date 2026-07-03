import type { ID, ISODate } from './common';

// product / category / product_image
// 규칙: 옵션 없음, 상품 이미지 1장(image_url)
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface Category {
  id: ID;
  name: string;
  sort_order: number;
  deleted_at: ISODate | null;
}

export interface Product {
  id: ID;
  name: string;
  price: number;
  description: string;
  status: ProductStatus;
  stock: number;
  category_id: ID;
  image_url: string; // product_image 대표 1장
  created_at: ISODate;
}
