import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { apiGetAdminOrders, type AdminOrderSummary } from '@/lib/api';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '결제대기',
  PAYMENT_COMPLETED: '결제완료',
  PREPARING_SHIPMENT: '배송준비',
  SHIPPED: '배송중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  REFUND_REQUESTED: '환불요청',
  REFUND_COMPLETED: '환불완료',
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();

  const [rows, setRows] = useState<AdminOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SIZE = 20;

  useEffect(() => {
    if (!adminSession || !accessToken) return;
    setLoading(true);
    setError(null);

    apiGetAdminOrders(accessToken, { keyword, status, dateFrom, dateTo, page, size: SIZE })
      .then((res) => { setRows(res.orders); setTotal(res.total); })
      .catch((e: any) => { setError(e?.message ?? '주문 목록을 불러올 수 없습니다.'); setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [adminSession, accessToken, keyword, status, dateFrom, dateTo, page]);

  if (!adminSession) return null;

  const totalPages = Math.ceil(total / SIZE);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>주문 관리</h1>

      {/* 검색/필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="주문번호 또는 구매자 검색"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
        >
          <option value="">전체 상태</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>
      ) : rows.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>주문이 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  {['주문번호', '구매자', '대표상품', '금액', '상태', '주문일', ''].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: h === '금액' ? 'right' : h === '상태' ? 'center' : 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace' }}>{o.orderNumber}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{o.buyerName || '-'}<br /><span style={{ fontSize: '11px', color: '#999' }}>{o.buyerEmail}</span></td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{o.mainProductName}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>₩{o.finalAmount.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '2px', fontSize: '11px' }}>
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {new Date(o.orderedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/orders/${o.orderId}`)}
                        style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '11px' }}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                이전
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px', color: '#666' }}>
                {page + 1} / {totalPages} (총 {total}건)
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
