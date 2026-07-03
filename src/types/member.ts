import type { ID, ISODate } from './common';

// member 테이블
export type Gender = 'MALE' | 'FEMALE';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
export type MemberRole = 'USER' | 'ADMIN';

export interface Member {
  id: ID;
  email: string;
  name: string;
  phone: string;
  birth: ISODate; // DATE
  gender: Gender;
  status: MemberStatus;
  role: MemberRole;
  last_login: ISODate | null;
  created_at: ISODate;
}

// email_verification 테이블 (인증 플로우용)
export interface EmailVerification {
  email: string;
  code: string;
  verification_token: string;
  verified: boolean;
  code_expires_at: ISODate;
  token_expires_at: ISODate;
}
