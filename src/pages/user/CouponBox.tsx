import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  apiDownloadEventCoupon,
  apiGetEventCouponBoards,
  type EventCoupon,
  type EventCouponBoard,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const COUPON_STATE_LABEL: Record<EventCoupon['state'], string> = {
  open: '받기',
  upcoming: '오픈 예정',
  soldout: '품절',
  closed: '종료',
};

function CouponBoxPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [boards, setBoards] = useState<EventCouponBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadBoards = () => {
    setLoading(true);
    setError(null);
    return apiGetEventCouponBoards(accessToken)
      .then(setBoards)
      .catch((e: { message?: string }) => setError(e?.message ?? '이벤트를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleDownload = async (coupon: EventCoupon) => {
    if (!accessToken) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      setTimeout(() => navigate('/'), 1200);
      return;
    }
    setIssuingId(coupon.id);
    try {
      await apiDownloadEventCoupon(accessToken, coupon.id);
      setToast({ message: '쿠폰이 발급되었습니다.', type: 'success' });
      await loadBoards();
    } catch (e) {
      const message = (e as { message?: string }).message ?? '쿠폰 발급에 실패했습니다.';
      setToast({ message, type: 'error' });
    } finally {
      setIssuingId(null);
    }
  };

  const allCoupons = boards.flatMap((board) =>
    (board.coupons ?? []).map((coupon) => ({ board, coupon }))
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>이벤트</h1>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>}
        {error && !loading && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {boards.length > 0 && (
              <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      onClick={() => navigate(`/event?board=${board.id}`)}
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
                      {board.thumbnailUrl && (
                        <img
                          src={board.thumbnailUrl}
                          alt={board.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                        />
                      )}
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '8px', minHeight: '40px' }}>{board.title}</h3>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {board.content}
                        </p>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {new Date(board.startAt).toLocaleDateString()} ~ {new Date(board.endAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>쿠폰 받기</h2>

              {allCoupons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>진행 중인 쿠폰이 없습니다.</div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {allCoupons.map(({ board, coupon }) => {
                    const isBusy = issuingId === coupon.id;
                    const disabled = coupon.state !== 'open' || coupon.alreadyDownloaded || isBusy;
                    const buttonLabel = isBusy
                      ? '발급 중...'
                      : coupon.alreadyDownloaded
                        ? '발급 완료'
                        : COUPON_STATE_LABEL[coupon.state];
                    return (
                      <div
                        key={`${board.id}-${coupon.id}`}
                        style={{
                          border: '1px solid #eee',
                          borderRadius: '4px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: disabled ? '#f9f9f9' : 'white',
                          opacity: disabled ? 0.75 : 1,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>{board.title}</div>
                          <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>{coupon.name}</h4>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                            <span>
                              {coupon.discountType === 'FIXED'
                                ? `₩${coupon.discountValue.toLocaleString()}`
                                : `${coupon.discountValue}%`}{' '}
                              할인
                            </span>
                            <span>최소 ₩{coupon.minOrderPrice.toLocaleString()}</span>
                            <span>~{new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                            남은 수량: {coupon.remainingQuantity.toLocaleString()}장
                          </div>
                        </div>
                        <div>
                          <Button
                            onClick={() => handleDownload(coupon)}
                            disabled={disabled}
                            style={{ opacity: disabled ? 0.5 : 1, minWidth: '100px' }}
                          >
                            {buttonLabel}
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
      </div>
    </>
  );
}

export default CouponBoxPage;
export { CouponBoxPage };
