import { useState } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface Coupon {
  id: number;
  code: string;
  discount_rate: number;
  max_discount_amount: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const MOCK_COUPONS: Coupon[] = [
  {
    id: 1,
    code: 'SUMMER2024',
    discount_rate: 10,
    max_discount_amount: 5000,
    min_order_amount: 20000,
    valid_from: '2024-07-01',
    valid_until: '2024-08-31',
    is_active: true,
  },
  {
    id: 2,
    code: 'WELCOME500',
    discount_rate: 20,
    max_discount_amount: 500,
    min_order_amount: 5000,
    valid_from: '2024-01-01',
    valid_until: '2024-12-31',
    is_active: true,
  },
];

export default function AdminCouponsPage() {
  const { adminSession } = useAdminAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discount_rate: 10, max_discount_amount: 5000, min_order_amount: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!adminSession) return null;

  const handleAddCoupon = () => {
    if (!form.code.trim()) {
      setToast({ message: '쿠폰 코드를 입력해주세요.', type: 'error' });
      return;
    }
    setCoupons([
      ...coupons,
      {
        id: coupons.length + 1,
        code: form.code,
        discount_rate: form.discount_rate,
        max_discount_amount: form.max_discount_amount,
        min_order_amount: form.min_order_amount,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
      },
    ]);
    setForm({ code: '', discount_rate: 10, max_discount_amount: 5000, min_order_amount: 0 });
    setIsFormOpen(false);
    setToast({ message: '쿠폰이 추가되었습니다.', type: 'success' });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>쿠폰 관리</h1>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            {isFormOpen ? '취소' : '쿠폰 추가'}
          </Button>
        </div>

        {isFormOpen && (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px', marginBottom: '24px', display: 'grid', gap: '12px' }}>
            <input
              type="text"
              placeholder="쿠폰 코드"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <input
              type="number"
              placeholder="할인율 (%)"
              value={form.discount_rate}
              onChange={(e) => setForm({ ...form, discount_rate: Number(e.target.value) })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <input
              type="number"
              placeholder="최대 할인 금액"
              value={form.max_discount_amount}
              onChange={(e) => setForm({ ...form, max_discount_amount: Number(e.target.value) })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <input
              type="number"
              placeholder="최소 주문 금액"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <Button onClick={handleAddCoupon}>추가</Button>
          </div>
        )}

        <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>코드</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>할인율</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>최대 할인</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>최소주문</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>유효기간</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{coupon.code}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{coupon.discount_rate}%</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                    ₩{coupon.max_discount_amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                    ₩{coupon.min_order_amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    {coupon.valid_from} ~ {coupon.valid_until}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        background: coupon.is_active ? '#e8f5e9' : '#ffebee',
                        color: coupon.is_active ? '#2e7d32' : '#c62828',
                        borderRadius: '2px',
                        fontSize: '11px',
                      }}
                    >
                      {coupon.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
