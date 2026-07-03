import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/types';
import type { AuthResult } from '@/lib/mockAuth';

// 로그인 세션 (mock). 실제 토큰 검증은 백엔드 연동 시 교체.
interface AuthState {
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAdmin: boolean;
  /** 로그인/회원가입 성공 결과로 세션 저장 */
  setSession: (result: AuthResult) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      refreshToken: null,
      isAdmin: false,
      setSession: (result) =>
        set({
          member: result.user,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          isAdmin: result.user.role === 'ADMIN',
        }),
      logout: () =>
        set({
          member: null,
          accessToken: null,
          refreshToken: null,
          isAdmin: false,
        }),
    }),
    { name: 'snackdeal-auth' }
  )
);
