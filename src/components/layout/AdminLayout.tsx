import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Ticket,
  Megaphone,
  Users,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { apiAdminLogout } from '@/lib/api';

const navItems = [
  { to: '/admin', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: '상품관리', icon: Package },
  { to: '/admin/categories', label: '카테고리', icon: Tags },
  { to: '/admin/orders', label: '주문관리', icon: ShoppingBag },
  { to: '/admin/coupons', label: '쿠폰관리', icon: Ticket },
  { to: '/admin/coupon-boards', label: '이벤트게시판', icon: Megaphone },
  { to: '/admin/members', label: '회원관리', icon: Users },
  { to: '/admin/qna', label: '문의관리', icon: MessageSquare },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { accessToken, adminLogout } = useAdminAuthStore();

  const handleLogout = async () => {
    if (accessToken) {
      try { await apiAdminLogout(accessToken); } catch { /* ignore */ }
    }
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center px-6">
          <Link to="/admin" className="text-lg font-bold text-gray-900">
            SnackDeal <span className="text-brand-600">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-gray-200 bg-white px-8">
          <span className="text-sm text-gray-500">관리자</span>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
