import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { apiGetMe, type ApiError } from '@/lib/api';

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSessionFromApi } = useAuthStore();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      showToast('로그인에 실패했습니다.', 'error');
      navigate('/login', { replace: true });
      return;
    }

    apiGetMe(accessToken)
      .then((me) => {
        setSessionFromApi({ accessToken, refreshToken }, me);
        showToast(`${me.name}님 환영합니다.`, 'success');
        navigate('/', { replace: true });
      })
      .catch((e: ApiError) => {
        showToast(e.message ?? '로그인에 실패했습니다.', 'error');
        navigate('/login', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>로그인 처리 중...</div>
      </div>
    </div>
  );
}
