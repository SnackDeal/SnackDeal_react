import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { AuthShell } from '@/components/common/AuthShell';
import { GoogleLoginButton } from '@/components/common/GoogleLoginButton';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { apiGetMe, apiLogin, type ApiError } from '@/lib/api';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionFromApi } = useAuthStore();
  const adminLogout = useAdminAuthStore((state) => state.adminLogout);
  const showToast = useToastStore((s) => s.show);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!isEmail(email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await apiLogin(email, password);
      const me = await apiGetMe(tokens.accessToken);
      adminLogout();
      setSessionFromApi(tokens, me);
      showToast(`${me.name}님 환영합니다.`, 'success');
      navigate(from, { replace: true });
    } catch (apiErr) {
      const err = apiErr as ApiError;
      setError(err.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="로그인"
      subtitle="SnackDeal 계정으로 로그인하세요"
      footer={
        <>
          아직 회원이 아니신가요?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            회원가입
          </Link>
          <SocialLoginButtons />
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="mt-2">
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-400">
        테스트 계정: user@snackdeal.io / user1234
      </p>
    </AuthShell>
  );
}

function SocialLoginButtons() {
  return (
    <div className="mt-6">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">또는</span>
        </div>
      </div>
      <GoogleLoginButton />
    </div>
  );
}
