import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetOrders, type OrderSummary } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

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

export function OrderList() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const size = 10;

  useEffect(() => {
    if (!accessToken) {
      navigate('/', { replace: true });
      return;
    }

    setLoading(true);
    setError(null);
    apiGetOrders(accessToken, page, size)
      .then((result) => {
        setOrders(result.orders);
        setTotal(result.total);
      })
      .catch((e: { message?: string }) => {
        setError(e.message ?? '주문내역을 불러올 수 없습니다.');
        setOrders([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [accessToken, navigate, page]);

  const maxPage = Math.max(1, Math.ceil(total / size));

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>주문내역</h1>

      {error && <div style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩중...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px solid #eee', borderRadius: '8px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>주문내역이 없습니다.</p>
          <Button onClick={() => navigate('/product')}>상품 보러가기</Button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map((order) => (
              <Link
                key={order.orderId}
                to={`/mypage/orders/${order.orderId}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  padding: '18px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                    {formatDate(order.orderedAt)} · {order.orderNumber}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>
                    {order.mainProductName}
                    {order.itemCount > 1 ? ` 외 ${order.itemCount - 1}건` : ''}
                  </div>
                  <span style={{ fontSize: '13px', color: '#555' }}>
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 800 }}>
                  ₩{order.finalAmount.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>

          {maxPage > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                이전
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#666' }}>
                {page + 1} / {maxPage}
              </div>
              <Button variant="secondary" disabled={page + 1 >= maxPage} onClick={() => setPage((value) => value + 1)}>
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
