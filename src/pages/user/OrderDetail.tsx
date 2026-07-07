import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGetOrderDetail, apiRequestRefund, type OrderDetail as OrderDetailData } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: '결제대기',
  PAYMENT_COMPLETED: '결제완료',
  PREPARING_SHIPMENT: '배송준비중',
  SHIPPED: '배송중',
  COMPLETED: '구매확정',
  CANCELLED: '취소',
  REFUND_REQUESTED: '환불요청',
  REFUND_COMPLETED: '환불완료',
};

export function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuthStore();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundLoading, setRefundLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setLoading(true);
    setError(null);
    apiGetOrderDetail(accessToken, Number(id))
      .then(setOrder)
      .catch((e: { message?: string }) => setError(e.message ?? '주문 상세를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [accessToken, id, navigate]);

  const handleRefund = async () => {
    if (!accessToken || !order) return;
    const reason = window.prompt('환불 사유를 입력해주세요.');
    if (!reason?.trim()) return;

    setRefundLoading(true);
    try {
      await apiRequestRefund(accessToken, order.orderId, reason.trim());
      const updated = await apiGetOrderDetail(accessToken, order.orderId);
      setOrder(updated);
      setToast({ message: '환불 요청이 접수되었습니다.', type: 'success' });
    } catch (e) {
      setToast({
        message: (e as { message?: string }).message ?? '환불 요청에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩중...</div>;
  }

  if (error || !order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error ?? '주문을 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/mypage/orders')}>주문내역으로</Button>
      </div>
    );
  }

  const canRefund = ['PAYMENT_COMPLETED', 'PREPARING_SHIPMENT'].includes(order.status);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
          <div>
            <button
              type="button"
              onClick={() => navigate('/mypage/orders')}
              style={{ border: 0, background: 'none', padding: 0, marginBottom: '10px', color: '#666', cursor: 'pointer' }}
            >
              주문내역으로
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>주문 상세</h1>
            <p style={{ color: '#666', marginTop: '8px' }}>
              {order.orderNumber} · {formatDate(order.orderedAt)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>상태</div>
            <div style={{ fontWeight: 800 }}>{statusLabel[order.status] ?? order.status}</div>
          </div>
        </div>

        <Section title="주문 상품">
          {order.items.map((item) => (
            <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.productName}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>₩{item.price.toLocaleString()}</div>
              </div>
              <div style={{ color: '#666' }}>×{item.quantity}</div>
              <div style={{ fontWeight: 700 }}>₩{item.lineTotal.toLocaleString()}</div>
            </div>
          ))}
        </Section>

        <Section title="배송지">
          <div style={{ color: '#555', lineHeight: 1.8 }}>
            <div>{order.shipping.receiverName} / {order.shipping.receiverPhone}</div>
            <div>[{order.shipping.zipcode}] {order.shipping.address} {order.shipping.detailAddress}</div>
            {order.shipping.deliveryRequest && <div>요청사항: {order.shipping.deliveryRequest}</div>}
            {order.shipping.courier && (
              <div>택배사: {order.shipping.courier} / 송장번호: {order.shipping.trackingNumber}</div>
            )}
          </div>
        </Section>

        <Section title="결제 정보">
          <div style={{ display: 'grid', gap: '10px', maxWidth: '420px', marginLeft: 'auto' }}>
            <PriceRow label="상품금액" value={order.payment.productAmount} />
            <PriceRow label="배송비" value={order.payment.shippingFee} />
            <PriceRow label="할인금액" value={-order.payment.discountAmount} />
            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <PriceRow label="최종 결제금액" value={order.payment.finalAmount} strong />
            </div>
            {order.payment.receiptUrl && (
              <a href={order.payment.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '14px' }}>
                영수증 보기
              </a>
            )}
          </div>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {canRefund && (
            <Button variant="danger" disabled={refundLoading} onClick={handleRefund}>
              {refundLoading ? '요청중...' : '환불 요청'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/mypage/orders')}>
            목록
          </Button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid #eee', padding: '24px 0' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>{title}</h2>
      {children}
    </section>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: strong ? 800 : 500 }}>
      <span>{label}</span>
      <span>₩{value.toLocaleString()}</span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
