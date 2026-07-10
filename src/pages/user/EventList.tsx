import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  apiDownloadEventCoupon,
  apiGetEventCouponBoard,
  apiGetEventCouponBoards,
  type ApiError,
  type EventCoupon,
  type EventCouponBoard,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const COUPON_STATE_LABEL: Record<EventCoupon['state'], string> = {
  open: '쿠폰 받기',
  upcoming: '오픈 예정',
  soldout: '소진',
  closed: '종료',
};

export default function EventListPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [boards, setBoards] = useState<EventCouponBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [detail, setDetail] = useState<EventCouponBoard | null>(null);
  const [issuingId, setIssuingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiGetEventCouponBoards(accessToken)
      .then((rows) => {
        setBoards(rows);
        if (rows.length > 0) {
          setSelectedBoardId((prev) => prev ?? rows[0].id);
        }
      })
      .catch((e: { message?: string }) => setError(e?.message ?? '이벤트를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (selectedBoardId === null) {
      setDetail(null);
      return;
    }

    apiGetEventCouponBoard(selectedBoardId, accessToken)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedBoardId, accessToken]);

  const boardCoupons: EventCoupon[] = detail?.coupons ?? [];

  const refreshDetail = async () => {
    if (selectedBoardId === null) return;
    const fresh = await apiGetEventCouponBoard(selectedBoardId, accessToken).catch(() => null);
    if (fresh) setDetail(fresh);
  };

  const handleDownload = async (coupon: EventCoupon) => {
    if (!accessToken) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    setIssuingId(coupon.id);
    try {
      await apiDownloadEventCoupon(accessToken, coupon.id);
      setToast({ message: '쿠폰이 발급되었습니다.', type: 'success' });
      await refreshDetail();
    } catch (e) {
      const apiError = e as ApiError;
      if (['CO003', 'CO004', 'CO005', 'CO006', 'CO007'].includes(apiError.code)) {
        await refreshDetail();
      }
      setToast({ message: apiError.message ?? '쿠폰 발급에 실패했습니다.', type: 'error' });
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>이벤트</h1>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>}
        {error && !loading && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              background: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {!loading && boards.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>진행 중인 이벤트가 없습니다.</div>
        )}

        {!loading && boards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}>진행 중인 이벤트</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoardId(board.id)}
                    style={{
                      padding: '12px 16px',
                      border: selectedBoardId === board.id ? '2px solid #333' : '1px solid #eee',
                      borderRadius: '4px',
                      background: selectedBoardId === board.id ? '#f0f0f0' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: selectedBoardId === board.id ? 'bold' : 'normal',
                    }}
                  >
                    <div style={{ marginBottom: '4px' }}>{board.title}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{formatDateRange(board.startAt, board.endAt)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              {!detail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>이벤트를 선택해 주세요.</div>
              ) : (
                <>
                  <div style={{ marginBottom: '40px' }}>
                    {detail.thumbnailUrl && (
                      <img
                        src={detail.thumbnailUrl}
                        alt={detail.title}
                        style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '4px', marginBottom: '24px' }}
                      />
                    )}
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>{detail.title}</h2>
                    <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                      {detail.content}
                    </p>
                    <div style={{ fontSize: '14px', color: '#999' }}>{formatDateRange(detail.startAt, detail.endAt)}</div>
                  </div>

                  <section>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>제공 쿠폰</h3>

                    {boardCoupons.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>제공되는 쿠폰이 없습니다.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {boardCoupons.map((coupon) => {
                          const isBusy = issuingId === coupon.id;
                          const disabled = coupon.state !== 'open' || coupon.alreadyDownloaded || isBusy;
                          const buttonLabel = isBusy
                            ? '발급 중...'
                            : coupon.alreadyDownloaded
                              ? '받기 완료'
                              : COUPON_STATE_LABEL[coupon.state];

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
                                background: disabled ? '#f9f9f9' : 'white',
                                opacity: disabled ? 0.75 : 1,
                              }}
                            >
                              <div>
                                <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '16px' }}>{coupon.name}</h4>
                                <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: '#666' }}>
                                  <div>
                                    할인:{' '}
                                    <strong>
                                      {coupon.discountType === 'FIXED'
                                        ? `₩${coupon.discountValue.toLocaleString()}`
                                        : `${coupon.discountValue}%`}
                                    </strong>
                                  </div>
                                  <div>최소 주문금액: ₩{coupon.minOrderPrice.toLocaleString()}</div>
                                  <div>유효기간: {formatCouponPeriod(coupon.validFrom, coupon.validUntil)}</div>
                                  <div style={{ fontSize: '12px', color: '#999' }}>
                                    남은 수량: {formatRemainingQuantity(coupon.remainingQuantity)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Button
                                  onClick={() => handleDownload(coupon)}
                                  disabled={disabled}
                                  style={{ opacity: disabled ? 0.5 : 1, minWidth: '110px' }}
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
          </div>
        )}
      </div>
    </>
  );
}

function formatDateRange(startAt: string, endAt: string | null) {
  const start = new Date(startAt).toLocaleDateString();
  const end = endAt ? new Date(endAt).toLocaleDateString() : '상시';
  return `${start} ~ ${end}`;
}

function formatCouponPeriod(validFrom: string, validUntil: string | null) {
  const start = new Date(validFrom).toLocaleDateString();
  const end = validUntil ? new Date(validUntil).toLocaleDateString() : '기한 없음';
  return `${start} ~ ${end}`;
}

function formatRemainingQuantity(remainingQuantity: number | null) {
  return remainingQuantity === null ? '무제한' : `${remainingQuantity.toLocaleString()}장`;
}
