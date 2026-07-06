import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/types';
import type { AuthResult } from '@/lib/mockAuth';
import type { MemberDescription } from '@/lib/api';

interface AuthState {
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAdmin: boolean;
  setSession: (result: AuthResult) => void;
  /** 백엔드 응답(MemberDescription + TokenPair)으로 세션 저장 */
  setSessionFromApi: (tokens: { accessToken: string; refreshToken: string }, me: MemberDescription) => void;
  updateMember: (me: MemberDescription) => void;
  logout: () => void;
}

function toMember(me: MemberDescription): Member {
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    phone: me.phone,
    birth: me.birth,
    gender: me.gender,
    status: me.status,
    role: me.role,
    last_login: me.lastLogin,
    created_at: me.createdAt,
  };
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
      setSessionFromApi: (tokens, me) =>
        set({
          member: toMember(me),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAdmin: me.role === 'ADMIN',
        }),
      updateMember: (me) => set({ member: toMember(me) }),
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
