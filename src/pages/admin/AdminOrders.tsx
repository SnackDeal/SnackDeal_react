import { useState } from 'react';
import { useOrderStore } from '@/stores/orderStore';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function AdminOrdersPage() {
  const { adminSession } = useAdminAuthStore();
  const { orders } = useOrderStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!adminSession) return null;

  const selected = orders.find((o) => o.id === selectedId);

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>주문 관리</h1>

        {selected ? (
          <div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                marginBottom: '24px',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ← 목록으로
            </button>

            <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                {selected.order_number}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>배송지</h3>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                    <div>수령인: {selected.shipping.receiver_name}</div>
                    <div>연락처: {selected.shipping.receiver_phone}</div>
                    <div>주소: [{selected.shipping.zipcode}] {selected.shipping.address}</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>금액 정보</h3>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                    <div>상품금액: ₩{selected.product_amount.toLocaleString()}</div>
                    <div>배송료: ₩{selected.shipping_fee.toLocaleString()}</div>
                    <div style={{ fontWeight: '600', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '8px' }}>
                      최종금액: ₩{selected.final_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>주문 상품</h3>
                <div style={{ background: '#f9f9f9', borderRadius: '4px', padding: '12px' }}>
                  {selected.items.map((item) => (
                    <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                      <div>
                        {item.product_name} × {item.quantity}
                      </div>
                      <div>₩{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>주문번호</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>금액</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>상태</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{order.order_number}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>
                      ₩{order.final_amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                      <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '2px' }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedId(order.id ?? null)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
