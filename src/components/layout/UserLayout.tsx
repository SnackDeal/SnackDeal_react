import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { apiLogout } from '@/lib/api';

const navItems = [
  { to: '/products', label: '상품' },
  { to: '/event', label: '이벤트' },
  { to: '/cs/notice', label: '고객센터' },
];

export function UserLayout() {
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.getTotalItems());
  const { member, accessToken, logout } = useAuthStore();

  const handleLogout = async () => {
    if (accessToken) {
      try { await apiLogout(accessToken); } catch { /* ignore */ }
    }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-brand-600">
            SnackDeal
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/products"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="검색"
            >
              <Search size={20} />
            </Link>
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="장바구니"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/mypage"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="마이페이지"
            >
              <User size={20} />
            </Link>
            {member && (
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="로그아웃"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-400">
          © 2026 SnackDeal · 학생 MVP 프로토타입
        </div>
      </footer>
    </div>
  );
}
