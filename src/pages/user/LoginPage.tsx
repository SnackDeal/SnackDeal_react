import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { AuthShell } from '@/components/common/AuthShell';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { login, isEmail, type ApiError } from '@/lib/mockAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useToastStore((s) => s.show);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인 성공 후 이전 페이지 또는 메인으로 이동
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
      const result = await login(email, password);
      setSession(result);
      showToast(`${result.user.name}님 환영합니다.`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as ApiError).message ?? '로그인에 실패했습니다.');
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
        데모 계정 · user@snackdeal.com (비밀번호는 아무 값이나 입력)
      </p>
    </AuthShell>
  );
}
