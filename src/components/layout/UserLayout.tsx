import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  Bot,
  MessageCircle,
  Send,
  ShoppingCart,
  User,
  Search,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { apiAskChatbot, apiLogout } from '@/lib/api';

const navItems = [
  { to: '/products', label: '상품' },
  { to: '/event', label: '이벤트' },
];

const csNavItems = [
  { to: '/cs/notice', label: '공지게시판' },
  { to: '/cs/qna', label: '문의게시판' },
];

const customerCenterNavItems = csNavItems.map((item) =>
  item.to === '/cs/notice' ? { ...item, label: '공지사항' } : item.to === '/cs/qna' ? { ...item, label: '문의게시판' } : item
);

interface ChatMessage {
  role: 'bot' | 'user';
  content: string;
}

const CHATBOT_READY_MESSAGE =
  '안녕하세요. SnackDeal AI 상담입니다. 주문, 배송, 상품, 쿠폰 관련 질문을 입력해주세요.';

const CHATBOT_ERROR_MESSAGE =
  '챗봇 응답을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';

export function UserLayout() {
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.getTotalItems());
  const { member, accessToken, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: CHATBOT_READY_MESSAGE,
    },
  ]);

  const handleLogout = async () => {
    if (accessToken) {
      try { await apiLogout(accessToken); } catch { /* ignore */ }
    }
    logout();
    setIsMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question || isChatSending) return;

    setChatMessages((messages) => [
      ...messages,
      { role: 'user', content: question },
    ]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const response = await apiAskChatbot(question);
      setChatMessages((messages) => [
        ...messages,
        { role: 'bot', content: response.answer || '답변을 받지 못했습니다.' },
      ]);
    } catch {
      setChatMessages((messages) => [
        ...messages,
        { role: 'bot', content: CHATBOT_ERROR_MESSAGE },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
    );
  const myPageTarget = member ? '/mypage' : '/login';

  const mobileMenu = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-brand-600"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          SnackDeal
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="사용자 메뉴 닫기"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="px-3 pb-1 pt-3 text-xs font-semibold text-gray-400">고객센터</div>
        {customerCenterNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="border-t border-gray-100 pt-2">
          <NavLink
            to="/admin/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            관리자 로그인
          </NavLink>
        </div>
      </nav>

      <div className="space-y-1 border-t border-gray-200 px-3 py-3">
        <NavLink
          to="/cart"
          onClick={() => setIsMobileMenuOpen(false)}
          className={mobileNavLinkClass}
        >
          장바구니{cartCount > 0 ? ` (${cartCount})` : ''}
        </NavLink>
        <NavLink
          to={myPageTarget}
          onClick={() => setIsMobileMenuOpen(false)}
          className={mobileNavLinkClass}
        >
          {member ? '마이페이지' : '로그인'}
        </NavLink>
        {member && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:gap-8">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="사용자 메뉴 열기"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="text-xl font-bold tracking-tight text-brand-600">
            SnackDeal
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
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
            <div className="group relative">
              <button
                type="button"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                고객센터
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-36 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                  {customerCenterNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/admin/login"
              className="hidden items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 lg:inline-flex"
              aria-label="관리자 로그인"
            >
              <ShieldCheck size={18} />
              관리자 로그인
            </Link>
            <Link
              to="/products"
              className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:block"
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
              to={myPageTarget}
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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="사용자 메뉴 배경 닫기"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-xl">
            {mobileMenu}
          </aside>
        </div>
      )}

      <main className="user-content mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <div className="fixed bottom-6 right-4 z-30 flex flex-col items-center gap-3 sm:right-6">
        <button
          type="button"
          onClick={() => setIsChatOpen((open) => !open)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-700 shadow-lg transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
          aria-label="챗봇 열기"
        >
          <MessageCircle size={24} />
        </button>
        <button
          type="button"
          onClick={handleScrollTop}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-800"
          aria-label="상단으로 이동"
        >
          <ArrowUp size={26} />
        </button>
      </div>

      {isChatOpen && (
        <section className="fixed bottom-40 right-4 z-40 flex h-[460px] w-[min(calc(100vw-2rem),360px)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl sm:right-6">
          <div className="flex items-center justify-between border-b border-gray-200 bg-brand-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <div className="text-sm font-bold">SnackDeal AI 상담</div>
                <div className="text-xs text-white/80">
                  실시간 챗봇
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="챗봇 닫기"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm',
                    message.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'border border-gray-200 bg-white text-gray-700'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitChat} className="flex gap-2 border-t border-gray-200 bg-white p-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="질문을 입력하세요"
              disabled={isChatSending}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={isChatSending}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              aria-label="질문 보내기"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-400">
          © 2026 SnackDeal · 학생 MVP 프로토타입
        </div>
      </footer>
    </div>
  );
}
