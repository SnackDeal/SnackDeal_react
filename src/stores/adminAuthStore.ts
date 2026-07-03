import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminSession {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

interface AdminAuthState {
  adminSession: AdminSession | null;
  setAdminSession: (session: AdminSession | null) => void;
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

      setAdminSession: (session) => set({ adminSession: session }),

      adminLogin: (email, password) => {
        const admin = ADMIN_ACCOUNTS.find((a) => a.email === email && a.password === password);
        if (admin) {
          set({
            adminSession: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
            },
          });
          return true;
        }
        return false;
      },

      adminLogout: () => set({ adminSession: null }),
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
