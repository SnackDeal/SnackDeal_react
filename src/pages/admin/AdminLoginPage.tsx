import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { apiAdminLogin, apiGetMe, type ApiError } from '@/lib/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminSession, setAdminSession, setTokens } = useAdminAuthStore();
  const [email, setEmail] = useState('admin@snackdeal.io');
  const [password, setPassword] = useState('admin1234');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (adminSession) navigate('/admin');
  }, [adminSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setToast({ message: '이메일과 비밀번호를 입력해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const tokens = await apiAdminLogin(email, password);
      const me = await apiGetMe(tokens.accessToken);
      if (me.role !== 'ADMIN') throw { code: 'FORBIDDEN', message: '관리자 계정이 아닙니다.' } as ApiError;
      setTokens(tokens);
      setAdminSession({ id: me.id, email: me.email, name: me.name, role: 'ADMIN' });
      setToast({ message: '관리자 로그인 성공', type: 'success' });
      setTimeout(() => navigate('/admin'), 800);
    } catch (e) {
      const ae = e as ApiError;
      setToast({ message: ae.message ?? '이메일 또는 비밀번호가 맞지 않습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ background: 'white', borderRadius: '4px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>
          관리자 로그인
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Button type="submit" style={{ marginTop: '16px' }} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f9f9f9', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
          <strong>테스트 계정:</strong>
          <div>이메일: admin@snackdeal.io</div>
          <div>비밀번호: admin1234</div>
        </div>
      </div>
    </div>
  );
}
