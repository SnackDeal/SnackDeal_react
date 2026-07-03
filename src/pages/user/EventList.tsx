import { useState } from 'react';
import { useCouponStore } from '@/stores/couponStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export default function EventListPage() {
  const { getCouponBoards, getCoupons, addUserCoupon, getUserCoupons } = useCouponStore();
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const boards = getCouponBoards();
  const coupons = getCoupons();
  const userCoupons = getUserCoupons();
  const userCouponIds = new Set(userCoupons.map((uc) => uc.coupon_id));

  const selectedBoardData = boards.find((b) => b.id === selectedBoard);
  const boardCoupons = selectedBoardData
    ? coupons.filter((c) => c.is_active && c.issue_type === 'EVENT')
    : [];

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

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
          {/* Event List Sidebar */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}>진행 중인 이벤트</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoard(board.id)}
                  style={{
                    padding: '12px 16px',
                    border: selectedBoard === board.id ? '2px solid #333' : '1px solid #eee',
                    borderRadius: '4px',
                    background: selectedBoard === board.id ? '#f0f0f0' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: selectedBoard === board.id ? 'bold' : 'normal',
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>{board.title}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(board.start_at).toLocaleDateString()} ~{' '}
                    {new Date(board.end_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Event Detail */}
          <div>
            {!selectedBoard ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                진행 중인 이벤트를 선택해주세요.
              </div>
            ) : (
              <>
                {selectedBoardData && (
                  <>
                    {/* Board Header */}
                    <div style={{ marginBottom: '40px' }}>
                      <img
                        src={selectedBoardData.thumbnail_url}
                        alt={selectedBoardData.title}
                        style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '4px', marginBottom: '24px' }}
                      />
                      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
                        {selectedBoardData.title}
                      </h2>
                      <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '16px' }}>
                        {selectedBoardData.content}
                      </p>
                      <div style={{ fontSize: '14px', color: '#999' }}>
                        {new Date(selectedBoardData.start_at).toLocaleDateString()} ~{' '}
                        {new Date(selectedBoardData.end_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Coupons */}
                    <section>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                        제공 쿠폰
                      </h3>

                      {boardCoupons.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                          제공하는 쿠폰이 없습니다.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {boardCoupons.map((coupon) => {
                            const isAlreadyIssued = userCouponIds.has(coupon.id);
                            const isSoldOut = coupon.issued_quantity >= coupon.total_quantity;

                            return (
                              <div
                                key={coupon.id}
                                style={{
                                  border: '1px solid #eee',
                                  borderRadius: '4px',
                                  padding: '20px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: isAlreadyIssued || isSoldOut ? '#f9f9f9' : 'white',
                                  opacity: isAlreadyIssued || isSoldOut ? 0.7 : 1,
                                }}
                              >
                                <div>
                                  <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '16px' }}>
                                    {coupon.name}
                                  </h4>
                                  <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: '#666' }}>
                                    <div>
                                      할인: {' '}
                                      <strong>
                                        {coupon.discount_type === 'FIXED'
                                          ? `₩${coupon.discount_value.toLocaleString()}`
                                          : `${coupon.discount_value}%`}
                                      </strong>
                                    </div>
                                    <div>
                                      최소 주문금액: ₩{coupon.min_order_price.toLocaleString()}
                                    </div>
                                    <div>
                                      유효기간: {new Date(coupon.valid_from).toLocaleDateString()} ~{' '}
                                      {new Date(coupon.valid_until).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                      발급: {coupon.issued_quantity} / {coupon.total_quantity}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Button
                                    onClick={() => handleDownloadCoupon(coupon)}
                                    disabled={isAlreadyIssued || isSoldOut}
                                    style={{
                                      opacity: isAlreadyIssued || isSoldOut ? 0.5 : 1,
                                      minWidth: '100px',
                                    }}
                                  >
                                    {isAlreadyIssued ? '발급 완료' : isSoldOut ? '품절' : '쿠폰 받기'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
