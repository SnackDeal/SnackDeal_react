import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiGetAdminOrderDetail,
  apiUpdateOrderStatus,
  apiAdminRefund,
  type AdminOrderDetail as AdminOrderDetailType,
  type ApiError,
} from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '결제대기',
  PAYMENT_COMPLETED: '결제완료',
  PREPARING_SHIPMENT: '배송준비',
  SHIPPED: '배송중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  REFUND_REQUESTED: '환불요청',
  REFUND_COMPLETED: '환불완료',
};

const NEXT_STATUSES: Record<string, string[]> = {
  PAYMENT_COMPLETED: ['PREPARING_SHIPMENT', 'CANCELLED'],
  PREPARING_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED'],
};

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();

  const [order, setOrder] = useState<AdminOrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 상태 변경
  const [newStatus, setNewStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  // 환불 처리
  const [refundUpdating, setRefundUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    if (!adminSession || !id) return;
    if (!accessToken) { setLoading(false); setError('관리자 토큰이 없습니다. 다시 로그인해주세요.'); return; }

    apiGetAdminOrderDetail(accessToken, Number(id))
      .then((d) => { setOrder(d); setNewStatus(NEXT_STATUSES[d.status]?.[0] ?? d.status); })
      .catch((e: ApiError) => setError(e.message ?? '주문을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [adminSession, accessToken, id]);

  const handleStatusUpdate = async () => {
    if (!order || !accessToken) return;
    setStatusUpdating(true);
    setStatusError('');
    setStatusSuccess('');
    try {
      const memoText = memo.trim() || undefined;
      const opts: { memo?: string; courier?: string; trackingNumber?: string } = {};
      if (memoText) opts.memo = memoText;
      if (newStatus === 'SHIPPED') {
        if (courier.trim()) opts.courier = courier.trim();
        if (trackingNumber.trim()) opts.trackingNumber = trackingNumber.trim();
      }
      const res = await apiUpdateOrderStatus(accessToken, order.id, newStatus, opts);
      setOrder((prev) => prev ? { ...prev, status: res.status, manualOverride: res.manualOverride } : prev);
      setNewStatus(NEXT_STATUSES[res.status]?.[0] ?? res.status);
      const label = STATUS_LABELS[res.status] ?? res.status;
      setStatusSuccess(`${label}(으)로 변경되었습니다.${memoText ? ` 메모: ${memoText}` : ''}`);
      setMemo('');
      setCourier('');
      setTrackingNumber('');
    } catch (e) {
      setStatusError((e as ApiError).message ?? '상태 변경에 실패했습니다.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRefund = async (approve: boolean) => {
    if (!order || !accessToken) return;
    if (!approve && !rejectReason.trim()) { setRefundError('거절 사유를 입력해주세요.'); return; }
    setRefundUpdating(true);
    setRefundError('');
    try {
      const res = await apiAdminRefund(accessToken, order.id, {
        approve,
        restoreStock: approve ? true : undefined,
        rejectReason: !approve ? rejectReason : undefined,
      });
      setOrder((prev) => prev ? { ...prev, status: res.status } : prev);
      setRejectReason('');
    } catch (e) {
      setRefundError((e as ApiError).message ?? '환불 처리에 실패했습니다.');
    } finally {
      setRefundUpdating(false);
    }
  };

  if (!adminSession) return null;
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>{error}</div>;
  if (!order) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/admin/orders')}
        style={{ marginBottom: '24px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '12px' }}
      >
        ← 목록으로
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>{order.orderNumber}</h1>
          <span style={{ padding: '4px 10px', background: '#f0f0f0', borderRadius: '2px', fontSize: '12px' }}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          {order.manualOverride && (
            <span style={{ marginLeft: '8px', padding: '4px 8px', background: '#e3f2fd', color: '#1565c0', borderRadius: '2px', fontSize: '11px' }}>수동변경</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 구매자 */}
        <section style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>구매자</h3>
          <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
            <div>{order.buyer.name} ({order.buyer.email})</div>
            <div>총 주문 {order.buyer.totalOrderCount}건</div>
          </div>
        </section>

        {/* 배송지 */}
        <section style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>배송지</h3>
          <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
            <div>{order.shipping.receiverName} / {order.shipping.receiverPhone}</div>
            <div>[{order.shipping.zipcode}] {order.shipping.address} {order.shipping.detailAddress}</div>
            {order.shipping.courier && <div>택배사: {order.shipping.courier} / {order.shipping.trackingNumber}</div>}
          </div>
        </section>
      </div>

      {/* 주문 상품 */}
      <section style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>주문 상품</h3>
        {order.items.map((item) => (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
            <span>{item.productName} × {item.quantity}</span>
            <span>₩{item.lineTotal.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
          <div>상품금액: ₩{order.payment.productAmount.toLocaleString()}</div>
          <div>배송비: ₩{order.payment.shippingFee.toLocaleString()}</div>
          {order.payment.usedCoupon && <div>쿠폰: {order.payment.usedCoupon} (-₩{order.payment.discountAmount.toLocaleString()})</div>}
          <div style={{ fontWeight: '600', marginTop: '4px' }}>최종금액: ₩{order.payment.finalAmount.toLocaleString()}</div>
        </div>
      </section>

      {/* 상태 변경 */}
      {(NEXT_STATUSES[order.status]?.length ?? 0) > 0 ? (
      <section style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>상태 변경</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            >
              {NEXT_STATUSES[order.status]!.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <input
              placeholder="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={statusUpdating}
            style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#333', color: 'white', cursor: statusUpdating ? 'not-allowed' : 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            {statusUpdating ? '처리 중...' : '변경'}
          </button>
        </div>
        {newStatus === 'SHIPPED' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <input
              placeholder="택배사 (예: CJ대한통운)"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
            <input
              placeholder="운송장번호"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{ flex: 2, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>
        )}
        {statusSuccess && <p style={{ color: '#2e7d32', fontSize: '13px', marginTop: '8px' }}>{statusSuccess}</p>}
        {statusError && <p style={{ color: '#c62828', fontSize: '13px', marginTop: '8px' }}>{statusError}</p>}
      </section>
      ) : (
      <section style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px', marginBottom: '24px', color: '#999', fontSize: '13px' }}>
        현재 상태({STATUS_LABELS[order.status] ?? order.status})에서는 상태를 변경할 수 없습니다.
      </section>
      )}

      {/* 환불 처리 (REFUND_REQUESTED 상태일 때만) */}
      {order.status === 'REFUND_REQUESTED' && (
        <section style={{ border: '1px solid #fbbf24', borderRadius: '4px', padding: '16px', background: '#fffbf0' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#92400e' }}>환불 처리</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '8px' }}>
            <input
              placeholder="거절 시 사유 입력"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
            />
            <button
              onClick={() => handleRefund(false)}
              disabled={refundUpdating}
              style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              거절
            </button>
            <button
              onClick={() => handleRefund(true)}
              disabled={refundUpdating}
              style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#c62828', color: 'white', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {refundUpdating ? '처리 중...' : '환불 승인'}
            </button>
          </div>
          {refundError && <p style={{ color: '#c62828', fontSize: '13px' }}>{refundError}</p>}
        </section>
      )}
    </div>
  );
}
