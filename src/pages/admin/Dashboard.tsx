import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { apiGetDashboard, type DashboardData, type ApiError } from '@/lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminSession, accessToken, adminLogout } = useAdminAuthStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!adminSession) { navigate('/admin/login'); return; }
    if (!accessToken) { setError('로그인이 필요합니다.'); return; }

    apiGetDashboard(accessToken)
      .then(setData)
      .catch((e: ApiError) => setError(e.message ?? '대시보드를 불러올 수 없습니다.'));
  }, [adminSession, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!adminSession) return <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>{error}</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>;

  const stats = [
    { label: '금일 주문 수', value: data.todayOrderCount, path: '/admin/orders' },
    { label: '금일 매출', value: `₩${data.todaySalesAmount.toLocaleString()}`, path: null },
    { label: '신규 회원', value: data.newMemberCount, path: '/admin/members' },
    { label: '저재고 상품', value: data.lowStockProductCount, path: '/admin/products', warn: data.lowStockProductCount > 0 },
    { label: '미처리 문의', value: data.pendingQnaCount, path: '/admin/qna', warn: data.pendingQnaCount > 0 },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>대시보드</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {adminSession.name} 관리자님
          <button
            onClick={() => { adminLogout(); navigate('/admin/login'); }}
            style={{ marginLeft: '16px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '12px' }}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={() => s.path && navigate(s.path)}
            style={{
              border: '1px solid #eee', borderRadius: '4px', padding: '24px',
              cursor: s.path ? 'pointer' : 'default',
              background: s.warn ? '#fffbf0' : 'white',
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: s.warn ? '#f59e0b' : '#333' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>관리 메뉴</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {[
            { label: '상품 관리', path: '/admin/products' },
            { label: '카테고리', path: '/admin/categories' },
            { label: '주문 관리', path: '/admin/orders' },
            { label: '쿠폰 관리', path: '/admin/coupons' },
            { label: '회원 관리', path: '/admin/members' },
            { label: '문의 관리', path: '/admin/qna' },
          ].map((menu) => (
            <button
              key={menu.path}
              onClick={() => navigate(menu.path)}
              style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              {menu.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
