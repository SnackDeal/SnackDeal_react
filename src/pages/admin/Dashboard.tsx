import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useOrderStore } from '@/stores/orderStore';
import { useCSStore } from '@/stores/csStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminSession, adminLogout } = useAdminAuthStore();
  const { orders } = useOrderStore();
  const { getQNAs } = useCSStore();

  useEffect(() => {
    if (!adminSession) {
      navigate('/admin/login');
    }
  }, [adminSession, navigate]);

  if (!adminSession) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>
      </>
    );
  }

  // Stats
  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.shipping.address).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.final_amount, 0);
  const unansweredQNAs = getQNAs().filter((q) => !q.is_answered).length;

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>대시보드</h1>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {adminSession.name} 관리자님
            <button
              onClick={() => {
                adminLogout();
                navigate('/admin/login');
              }}
              style={{
                marginLeft: '16px',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {/* Today Orders */}
          <div
            onClick={() => navigate('/admin/orders')}
            style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>금일 주문 수</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {todayOrders.length}
            </div>
          </div>

          {/* Today Revenue */}
          <div
            style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '24px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>금일 매출</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              ₩{todayRevenue.toLocaleString()}
            </div>
          </div>

          {/* Total Revenue */}
          <div
            style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '24px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>총 매출</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              ₩{totalRevenue.toLocaleString()}
            </div>
          </div>

          {/* Unanswered QNAs */}
          <div
            onClick={() => navigate('/admin/qna')}
            style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              background: unansweredQNAs > 0 ? '#fffbf0' : 'white',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>미처리 문의</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: unansweredQNAs > 0 ? '#ff6b6b' : '#333' }}>
              {unansweredQNAs}
            </div>
          </div>
        </div>

        {/* Quick Menu */}
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
                style={{
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {menu.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
