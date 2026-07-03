import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export default function CartPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { items, updateQuantity, removeItem, removeItems, clearCart, getTotalPrice } = useCartStore();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!session) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [session, navigate]);

  if (!session) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>
      </>
    );
  }

  const handleSelectItem = (productId: number) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.product_id));
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.length === 0) {
      setToast({ message: '선택된 상품이 없습니다.', type: 'error' });
      return;
    }
    removeItems(selectedIds);
    setSelectedIds([]);
    setToast({ message: '선택한 상품이 삭제되었습니다.', type: 'success' });
  };

  const handleClearAll = () => {
    if (confirm('정말 전체 삭제하시겠습니까?')) {
      clearCart();
      setSelectedIds([]);
      setToast({ message: '장바구니가 비워졌습니다.', type: 'success' });
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      setToast({ message: '장바구니가 비어있습니다.', type: 'error' });
      return;
    }
    // 품절 상품 확인
    const soldoutItems = items.filter((item) => item.is_soldout);
    if (soldoutItems.length > 0) {
      setToast({
        message: `${soldoutItems.map((i) => i.product_name).join(', ')}이(가) 품절되었습니다.`,
        type: 'error',
      });
      return;
    }
    navigate('/checkout');
  };

  const totalPrice = getTotalPrice();

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
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
          장바구니
        </h1>

        {items.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>
              장바구니에 담은 상품이 없습니다.
            </div>
            <Button onClick={() => navigate('/products')}>
              쇼핑 계속하기
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            {/* Items */}
            <div>
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 80px 1fr 80px 80px 50px',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '2px solid #333',
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div>상품</div>
                <div></div>
                <div style={{ textAlign: 'right' }}>수량</div>
                <div style={{ textAlign: 'right' }}>금액</div>
                <div></div>
              </div>

              {/* Items */}
              {items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 80px 1fr 80px 80px 50px',
                    gap: '12px',
                    padding: '16px 0',
                    borderBottom: '1px solid #eee',
                    alignItems: 'center',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.product_id)}
                      onChange={() => handleSelectItem(item.product_id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  {/* Image */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/products/${item.product_id}`)}
                    />
                  </div>

                  {/* Name & Stock */}
                  <div>
                    <div
                      style={{
                        fontWeight: '600',
                        marginBottom: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/products/${item.product_id}`)}
                    >
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ₩{item.price.toLocaleString()}
                    </div>
                    {item.is_soldout ? (
                      <div style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold', marginTop: '4px' }}>
                        품절
                      </div>
                    ) : item.max_stock < 10 ? (
                      <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '4px' }}>
                        {item.max_stock}개 남음
                      </div>
                    ) : null}
                  </div>

                  {/* Quantity */}
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                      }
                      disabled={item.is_soldout}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                        cursor: item.is_soldout ? 'not-allowed' : 'pointer',
                        opacity: item.is_soldout ? 0.5 : 1,
                        fontSize: '12px',
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.max_stock}
                      value={item.quantity}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        val = Math.max(1, Math.min(val, item.max_stock));
                        updateQuantity(item.product_id, val);
                      }}
                      disabled={item.is_soldout}
                      style={{
                        width: '40px',
                        height: '28px',
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                        textAlign: 'center',
                        fontSize: '12px',
                      }}
                    />
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, Math.min(item.max_stock, item.quantity + 1))
                      }
                      disabled={item.is_soldout || item.quantity === item.max_stock}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                        cursor: item.is_soldout || item.quantity === item.max_stock ? 'not-allowed' : 'pointer',
                        opacity: item.is_soldout || item.quantity === item.max_stock ? 0.5 : 1,
                        fontSize: '12px',
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', fontWeight: '600' }}>
                    ₩{(item.price * item.quantity).toLocaleString()}
                  </div>

                  {/* Delete */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        removeItem(item.product_id);
                        setSelectedIds((prev) =>
                          prev.filter((id) => id !== item.product_id)
                        );
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '16px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px', padding: '12px 0', borderTop: '1px solid #eee' }}>
                <Button
                  onClick={handleRemoveSelected}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  선택 삭제
                </Button>
                <Button
                  onClick={handleClearAll}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  전체 삭제
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '24px',
                height: 'fit-content',
                position: 'sticky',
                top: '24px',
              }}
            >
              <h3 style={{ fontWeight: 'bold', marginBottom: '24px', fontSize: '16px' }}>
                주문 요약
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  <span>상품금액</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  <span>배송료</span>
                  <span>₩3,000</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #eee',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  <span>예상 결제금액</span>
                  <span>₩{(totalPrice + 3000).toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                style={{ width: '100%', marginBottom: '12px' }}
              >
                주문하기
              </Button>
              <Button
                onClick={() => navigate('/products')}
                variant="secondary"
                style={{ width: '100%' }}
              >
                계속 쇼핑
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
