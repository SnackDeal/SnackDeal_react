import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AdminSession {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

interface AdminAuthState {
  adminSession: AdminSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAdminSession: (session: AdminSession | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  adminLogin: (email: string, password: string) => boolean;
  adminLogout: () => void;
}

const ADMIN_ACCOUNTS = [
  { id: 1, email: 'admin@snackdeal.com', password: 'admin1234', name: '관리자', role: 'ADMIN' as const },
];

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      adminSession: null,
      accessToken: null,
      refreshToken: null,

      setAdminSession: (session) => set({ adminSession: session }),
      setTokens: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),

      adminLogin: (email, password) => {
        const admin = ADMIN_ACCOUNTS.find((a) => a.email === email && a.password === password);
        if (admin) {
          set({
            adminSession: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
          });
          return true;
        }
        return false;
      },

      adminLogout: () => set({ adminSession: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'admin-auth-storage', storage: createJSONStorage(() => sessionStorage) }
  )
);
