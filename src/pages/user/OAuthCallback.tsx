import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { apiGetMe } from '@/lib/api';

/**
 * 구글 OAuth2 콜백 처리 페이지 (`/oauth2/callback`).
 *
 * 백엔드(OAuth2SuccessHandler)가 이메일로 기존 회원인지 확인한 뒤 두 경우로 나뉜다.
 *  1) 기존 회원 → 토큰 발급 후 `?accessToken=..&refreshToken=..`로 리다이렉트
 *  2) 신규 회원 → 토큰 없이 `?email=..&name=..`로 리다이렉트 (아직 회원이 아님)
 *
 * 신규 회원은 `/signup?email=..&name=..`으로 보내 추가정보 입력 후
 * `POST /member/join`을 `isSocialLogin: true`로 호출해 가입을 완료시킨다
 * (이메일 인증 스킵, 비밀번호는 서버가 임의 생성).
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSessionFromApi = useAuthStore((s) => s.setSessionFromApi);
  const showToast = useToastStore((s) => s.show);
  const [message, setMessage] = useState('로그인 처리 중…');
  const handled = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function finish() {
      // 1) 쿼리 파라미터 우선
      let accessToken = searchParams.get('accessToken');
      let refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // 2) 없으면 페이지 바디(JSON) 파싱 시도
      if ((!accessToken || !refreshToken) && !error) {
        try {
          const raw = document.body.innerText.trim();
          if (raw.startsWith('{')) {
            const parsed = JSON.parse(raw);
            accessToken = parsed.accessToken ?? accessToken;
            refreshToken = parsed.refreshToken ?? refreshToken;
          }
        } catch {
          /* 바디가 JSON 이 아니면 무시 */
        }
      }

      if (error) {
        showToast('구글 로그인에 실패했습니다.', 'error');
        navigate('/login?error=oauth', { replace: true });
        return;
      }

      // 신규 회원: 토큰 없이 email/name만 전달됨 → 추가정보 입력 후 회원가입 진행
      if (!accessToken || !refreshToken) {
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        if (email) {
          navigate(`/signup?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name ?? '')}`, {
            replace: true,
          });
          return;
        }
        showToast('구글 로그인에 실패했습니다.', 'error');
        navigate('/login?error=oauth', { replace: true });
        return;
      }

      try {
        const me = await apiGetMe(accessToken);
        setSessionFromApi({ accessToken, refreshToken }, me);
        showToast(`${me.name}님 환영합니다.`, 'success');
        navigate('/', { replace: true });
      } catch {
        setMessage('회원 정보 조회에 실패했습니다.');
        showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
        navigate('/login?error=oauth', { replace: true });
      }
    }

    finish();
  }, [navigate, searchParams, setSessionFromApi, showToast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
