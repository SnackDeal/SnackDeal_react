import type { Member, Gender } from '@/types';
import { members } from '@/mocks/members';
import { formatPhoneNumberForStorage } from '@/lib/phone';

/**
 * Mock 인증 서비스 — 백엔드 없이 회원/인증 API 흐름을 흉내낸다.
 * docs/1_회원_인증 명세 기준. 실제 SMTP/DB 대신 콘솔 로그 + 고정 코드 사용.
 *
 * 개발용 규칙:
 *  - 인증코드 발송: 콘솔에 "인증코드: 123456" 출력
 *  - 인증코드 검증: "123456" 입력 시 성공
 */

const MOCK_CODE = '123456';
const CODE_TTL_SEC = 300; // 5분
const TOKEN_TTL_SEC = 600; // 10분
const TEST_USER_EMAIL = 'user@snackdeal.io';
const TEST_USER_PASSWORD = 'user1234';

/** 지연을 흉내내는 유틸 */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: Member;
}

export interface ApiError {
  code: string;
  message: string;
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** 비밀번호 규칙: 8자 이상, 영문+숫자+특수문자 조합 */
export function isValidPassword(v: string): boolean {
  return (
    v.length >= 8 &&
    /[A-Za-z]/.test(v) &&
    /[0-9]/.test(v) &&
    /[^A-Za-z0-9]/.test(v)
  );
}

/** 이메일 중복 확인 (mock: mock members 기준) */
export async function checkEmailDuplicate(email: string): Promise<boolean> {
  await delay(300);
  return members.some((m) => m.email.toLowerCase() === email.toLowerCase());
}

/** POST /member/email/send-code — 인증코드 발송 (콘솔 로그로 대체) */
export async function sendCode(email: string): Promise<{ expires_in: number }> {
  if (!isEmail(email)) {
    throw { code: 'BAD_REQUEST', message: '이메일 형식이 올바르지 않습니다' } as ApiError;
  }
  if (await checkEmailDuplicate(email)) {
    throw { code: 'CONFLICT', message: '이미 가입된 이메일입니다' } as ApiError;
  }
  // 실제 SMTP 대신 콘솔 출력 (개발 환경 분기)
  console.log(`[SnackDeal] ${email} 인증코드: ${MOCK_CODE}`);
  await delay();
  return { expires_in: CODE_TTL_SEC };
}

/** POST /member/email/verify-code — 인증코드 검증 → verification_token 발급 */
export async function verifyCode(
  email: string,
  code: string
): Promise<{ verification_token: string; expires_in: number }> {
  await delay();
  if (code !== MOCK_CODE) {
    throw { code: 'BAD_REQUEST', message: '인증코드가 일치하지 않습니다' } as ApiError;
  }
  return {
    verification_token: `evt_mock_${btoa(email).slice(0, 12)}`,
    expires_in: TOKEN_TTL_SEC,
  };
}

export interface JoinPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  birth: string; // YYYY-MM-DD
  gender: Gender;
  verification_token: string;
}

/** POST /member/join — 회원가입 → 토큰 + user 반환 (자동 로그인) */
export async function join(payload: JoinPayload): Promise<AuthResult> {
  await delay();
  if (!payload.verification_token) {
    throw { code: 'UNAUTHORIZED', message: '이메일 인증이 필요합니다' } as ApiError;
  }
  if (await checkEmailDuplicate(payload.email)) {
    throw { code: 'CONFLICT', message: '이미 사용중인 이메일입니다' } as ApiError;
  }
  const user: Member = {
    id: Date.now(),
    email: payload.email.toLowerCase(),
    name: payload.name,
    phone: formatPhoneNumberForStorage(payload.phone),
    birth: payload.birth,
    gender: payload.gender,
    status: 'ACTIVE',
    role: 'USER',
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  // 회원가입 자동발급 쿠폰 지급은 쿠폰 도메인 구현 시 연결 (현재 mock 생략)
  console.log('[SnackDeal] 회원가입 완료 → 회원가입 쿠폰 지급(mock 생략)');
  return mockTokens(user);
}

/** POST /member/login — 로그인 (mock members 대조) */
export async function login(email: string, password: string): Promise<AuthResult> {
  await delay();
  const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
  if (!found || !password || (found.email === TEST_USER_EMAIL && password !== TEST_USER_PASSWORD)) {
    throw {
      code: 'UNAUTHORIZED',
      message: '아이디 또는 비밀번호가 일치하지 않습니다',
    } as ApiError;
  }
  if (found.status === 'DELETED') {
    throw { code: 'UNAUTHORIZED', message: '탈퇴 처리된 계정입니다' } as ApiError;
  }
  return mockTokens({ ...found, last_login: new Date().toISOString() });
}

function mockTokens(user: Member): AuthResult {
  return {
    access_token: `mock_access_${user.id}`,
    refresh_token: `mock_refresh_${user.id}`,
    user,
  };
}
