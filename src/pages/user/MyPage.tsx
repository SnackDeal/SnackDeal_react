import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { useCouponStore } from '@/stores/couponStore';
import { Button } from '@/components/ui/Button';

export default function MyPage() {
  const navigate = useNavigate();
  const { member, logout } = useAuthStore();
  const { orders } = useOrderStore();
  const { getUserCoupons } = useCouponStore();
  const [activeMenu, setActiveMenu] = useState<'overview' | 'orders' | 'coupons' | 'delivery'>('overview');

  useEffect(() => {
    if (!member) {
      navigate('/login');
    }
  }, [member, navigate]);

  if (!member) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>
      </>
    );
  }

  const recentOrders = orders.slice(0, 5);
  const activeCoupons = getUserCoupons('ACTIVE');
  const usedCoupons = getUserCoupons('USED');
  const expiredCoupons = getUserCoupons('EXPIRED');
  const totalOrderAmount = orders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalOrderCount = orders.length;

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px' }}>
          {/* Sidebar Menu */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}>
              {member.name}님
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setActiveMenu('overview')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: activeMenu === 'overview' ? '#f0f0f0' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: activeMenu === 'overview' ? 'bold' : 'normal',
                }}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveMenu('orders')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: activeMenu === 'orders' ? '#f0f0f0' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: activeMenu === 'orders' ? 'bold' : 'normal',
                }}
              >
                주문내역
              </button>
              <button
                onClick={() => setActiveMenu('coupons')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: activeMenu === 'coupons' ? '#f0f0f0' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: activeMenu === 'coupons' ? 'bold' : 'normal',
                }}
              >
                쿠폰함
              </button>
              <button
                onClick={() => setActiveMenu('delivery')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: activeMenu === 'delivery' ? '#f0f0f0' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: activeMenu === 'delivery' ? 'bold' : 'normal',
                }}
              >
                배송 주소록
              </button>
              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                로그아웃
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div>
            {/* Dashboard */}
            {activeMenu === 'overview' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>대시보드</h2>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      {activeCoupons.length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>사용 가능 쿠폰</div>
                  </div>
                  <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      ₩{totalOrderAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>총 주문 금액</div>
                  </div>
                  <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      {totalOrderCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>총 주문 횟수</div>
                  </div>
                </div>

                {/* Recent Orders */}
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>최근 주문 (5개)</h3>
                    <button
                      onClick={() => setActiveMenu('orders')}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      더보기
                    </button>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      주문 내역이 없습니다.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                      {recentOrders.map((order, idx) => (
                        <div
                          key={order.id}
                          style={{
                            padding: '16px',
                            borderBottom: idx < recentOrders.length - 1 ? '1px solid #eee' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/mypage/orders/${order.id}`)}
                        >
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{order.order_number}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {new Date(order.shipping.address).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              ₩{order.final_amount.toLocaleString()}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                background: '#f0f0f0',
                                borderRadius: '2px',
                                width: 'fit-content',
                                marginLeft: 'auto',
                              }}
                            >
                              {order.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Orders */}
            {activeMenu === 'orders' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>주문내역</h2>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>주문 내역이 없습니다.</div>
                ) : (
                  <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                    {orders.map((order, idx) => (
                      <div
                        key={order.id}
                        style={{
                          padding: '16px',
                          borderBottom: idx < orders.length - 1 ? '1px solid #eee' : 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/mypage/orders/${order.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '600' }}>{order.order_number}</div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {order.items.length}개 상품
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '12px' }}>
                          <div>{new Date(order.shipping.address).toLocaleDateString()}</div>
                          <div>₩{order.final_amount.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Coupons */}
            {activeMenu === 'coupons' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>쿠폰함</h2>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    사용 가능 ({activeCoupons.length})
                  </h3>
                  {activeCoupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '14px' }}>
                      사용 가능한 쿠폰이 없습니다.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {activeCoupons.map((uc) => (
                        <div
                          key={uc.id}
                          style={{
                            border: '1px solid #eee',
                            borderRadius: '4px',
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '8px' }}>{uc.coupon.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {uc.coupon.discount_type === 'FIXED'
                                ? `₩${uc.coupon.discount_value.toLocaleString()}`
                                : `${uc.coupon.discount_value}%`}{' '}
                              할인
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                              ~ {new Date(uc.coupon.valid_until).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              최소 ₩{uc.coupon.min_order_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    사용 완료 ({usedCoupons.length})
                  </h3>
                  {usedCoupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '14px' }}>
                      사용 완료한 쿠폰이 없습니다.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {usedCoupons.map((uc) => (
                        <div key={uc.id} style={{ padding: '12px', color: '#999', fontSize: '12px' }}>
                          {uc.coupon.name} - 사용함
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    만료됨 ({expiredCoupons.length})
                  </h3>
                  {expiredCoupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '14px' }}>
                      만료된 쿠폰이 없습니다.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {expiredCoupons.map((uc) => (
                        <div key={uc.id} style={{ padding: '12px', color: '#999', fontSize: '12px' }}>
                          {uc.coupon.name} - 만료됨
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery */}
            {activeMenu === 'delivery' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>배송 주소록</h2>
                <Button onClick={() => navigate('/mypage/delivery')}>주소록 관리</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
