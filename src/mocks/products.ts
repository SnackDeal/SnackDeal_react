import type { Category, Product } from '@/types';

export const categories: Category[] = [
  { id: 1, name: '스낵', sort_order: 1, deleted_at: null },
  { id: 2, name: '초콜릿', sort_order: 2, deleted_at: null },
  { id: 3, name: '캔디/젤리', sort_order: 3, deleted_at: null },
  { id: 4, name: '쿠키/비스킷', sort_order: 4, deleted_at: null },
  { id: 5, name: '음료', sort_order: 5, deleted_at: null },
];

export const products: Product[] = [
  {
    id: 1,
    name: '허니버터 감자칩',
    price: 1800,
    description: '달콤짭짤한 허니버터 감자칩.',
    status: 'ACTIVE',
    stock: 120,
    category_id: 1,
    image_url: '',
    created_at: '2026-06-01T09:00:00',
  },
  {
    id: 2,
    name: '다크 초콜릿 70%',
    price: 3200,
    description: '진한 카카오 70% 다크 초콜릿.',
    status: 'ACTIVE',
    stock: 0,
    category_id: 2,
    image_url: '',
    created_at: '2026-06-02T09:00:00',
  },
  {
    id: 3,
    name: '과일 젤리 믹스',
    price: 2500,
    description: '5가지 과일맛 젤리 믹스.',
    status: 'ACTIVE',
    stock: 64,
    category_id: 3,
    image_url: '',
    created_at: '2026-06-03T09:00:00',
  },
  {
    id: 4,
    name: '버터 쿠키 12입',
    price: 4500,
    description: '진한 버터향 쿠키 12입.',
    status: 'INACTIVE',
    stock: 8,
    category_id: 4,
    image_url: '',
    created_at: '2026-06-04T09:00:00',
  },
];
