import type { Member } from '@/types';

export const members: Member[] = [
  {
    id: 1,
    email: 'user@snackdeal.io',
    name: '김스낵',
    phone: '010-1234-5678',
    birth: '1998-03-15',
    gender: 'FEMALE',
    status: 'ACTIVE',
    role: 'USER',
    last_login: '2026-07-02T21:10:00',
    created_at: '2026-05-01T10:00:00',
  },
  {
    id: 2,
    email: 'admin@snackdeal.com',
    name: '관리자',
    phone: '010-0000-0000',
    birth: '1990-01-01',
    gender: 'MALE',
    status: 'ACTIVE',
    role: 'ADMIN',
    last_login: '2026-07-03T08:00:00',
    created_at: '2026-01-01T00:00:00',
  },
  {
    id: 3,
    email: 'inactive@snackdeal.com',
    name: '이휴면',
    phone: '010-2222-3333',
    birth: '1995-07-20',
    gender: 'MALE',
    status: 'INACTIVE',
    role: 'USER',
    last_login: '2026-01-10T12:00:00',
    created_at: '2025-12-01T10:00:00',
  },
];

/** mock 로그인용 기본 계정 */
export const mockUser = members[0];
export const mockAdmin = members[1];
