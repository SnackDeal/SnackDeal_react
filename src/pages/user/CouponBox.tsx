import { useState } from 'react';
import { useCouponStore } from '@/stores/couponStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

function CouponBoxPage() {
  const { getCouponBoards, getCoupons, addUserCoupon, getUserCoupons } = useCouponStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const boards = getCouponBoards();
  const coupons = getCoupons();
  const userCoupons = getUserCoupons();
  const userCouponIds = new Set(userCoupons.map((uc) => uc.coupon_id));

  const handleDownloadCoupon = (coupon: typeof coupons[0]) => {
    if (userCouponIds.has(coupon.id)) {
      setToast({ message: '이미 발급받은 쿠폰입니다.', type: 'error' });
      return;
    }
    if (coupon.issued_quantity >= coupon.total_quantity) {
      setToast({ message: '발급 수량이 소진되었습니다.', type: 'error' });
      return;
    }
    addUserCoupon(coupon);
    setToast({ message: '쿠폰이 발급되었습니다.', type: 'success' });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>이벤트</h1>

        {/* Event Boards */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {boards.map((board) => (
              <div
                key={board.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  overflow: 'hidden',
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
                <img
                  src={board.thumbnail_url}
                  alt={board.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '8px', minHeight: '40px' }}>
                    {board.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    {board.content}
                  </p>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(board.start_at).toLocaleDateString()} ~{' '}
                    {new Date(board.end_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Coupons */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>쿠폰 받기</h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            {coupons
              .filter((c) => c.is_active && c.issue_type === 'EVENT')
              .map((coupon) => {
                const isAlreadyIssued = userCouponIds.has(coupon.id);
                const isSoldOut = coupon.issued_quantity >= coupon.total_quantity;

                return (
                  <div
                    key={coupon.id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isAlreadyIssued || isSoldOut ? '#f9f9f9' : 'white',
                      opacity: isAlreadyIssued || isSoldOut ? 0.7 : 1,
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>{coupon.name}</h4>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                        <span>
                          {coupon.discount_type === 'FIXED'
                            ? `₩${coupon.discount_value.toLocaleString()}`
                            : `${coupon.discount_value}%`}{' '}
                          할인
                        </span>
                        <span>최소 ₩{coupon.min_order_price.toLocaleString()}</span>
                        <span>~{new Date(coupon.valid_until).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                        {coupon.issued_quantity} / {coupon.total_quantity}
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => handleDownloadCoupon(coupon)}
                        disabled={isAlreadyIssued || isSoldOut}
                        style={{
                          opacity: isAlreadyIssued || isSoldOut ? 0.5 : 1,
                        }}
                      >
                        {isAlreadyIssued ? '발급 완료' : isSoldOut ? '품절' : '받기'}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </>
  );
}

export default CouponBoxPage;
export { CouponBoxPage };
