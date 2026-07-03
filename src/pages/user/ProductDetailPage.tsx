import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { mockProductApi } from '@/lib/mockProducts';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { selectedProduct, setSelectedProduct, isLoading, setLoading } = useProductStore();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const product = await mockProductApi.getProduct(Number(productId));
        setSelectedProduct(product);
      } catch (err) {
        console.error('Failed to load product:', err);
        setToast({ message: '상품을 찾을 수 없습니다.', type: 'error' });
        setTimeout(() => navigate('/products'), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, setSelectedProduct, setLoading, navigate]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_image: selectedProduct.image_url,
      quantity,
      price: selectedProduct.price,
      max_stock: selectedProduct.stock,
      is_soldout: selectedProduct.is_soldout,
    });
    setToast({ message: '장바구니에 추가되었습니다.', type: 'success' });
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    addItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_image: selectedProduct.image_url,
      quantity,
      price: selectedProduct.price,
      max_stock: selectedProduct.stock,
      is_soldout: selectedProduct.is_soldout,
    });
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>로딩중...</div>
      </>
    );
  }

  if (!selectedProduct) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          상품을 찾을 수 없습니다.
        </div>
      </>
    );
  }

  const maxQuantity = selectedProduct.stock;
  const totalPrice = selectedProduct.price * quantity;

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
        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/products')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              textDecoration: 'underline',
            }}
          >
            상품
          </button>
          <span> / {selectedProduct.category} / {selectedProduct.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Image */}
          <div style={{ position: 'relative' }}>
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '4px',
                background: '#f5f5f5',
              }}
            />
            {selectedProduct.is_soldout && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  품절
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {selectedProduct.category}
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
                {selectedProduct.name}
              </h1>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px' }}>
                ₩{selectedProduct.price.toLocaleString()}
              </div>

              <div style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '16px 0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#666' }}>재고</span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: selectedProduct.is_soldout ? '#ff6b6b' : '#333',
                    }}
                  >
                    {selectedProduct.is_soldout ? '품절' : `${selectedProduct.stock}개`}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px', color: '#666', lineHeight: '1.6' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>상품설명</h3>
                <p>{selectedProduct.description}</p>
              </div>
            </div>

            {/* Quantity & Purchase */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  수량
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity === 1 || selectedProduct.is_soldout}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: quantity === 1 || selectedProduct.is_soldout ? 'not-allowed' : 'pointer',
                      opacity: quantity === 1 || selectedProduct.is_soldout ? 0.5 : 1,
                      fontSize: '16px',
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      val = Math.max(1, Math.min(val, maxQuantity));
                      setQuantity(val);
                    }}
                    disabled={selectedProduct.is_soldout}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity === maxQuantity || selectedProduct.is_soldout}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: quantity === maxQuantity || selectedProduct.is_soldout ? 'not-allowed' : 'pointer',
                      opacity: quantity === maxQuantity || selectedProduct.is_soldout ? 0.5 : 1,
                      fontSize: '16px',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  marginBottom: '24px',
                  textAlign: 'right',
                }}
              >
                <div style={{ color: '#666', marginBottom: '8px' }}>총 결제금액</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                  ₩{totalPrice.toLocaleString()}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  onClick={handleAddToCart}
                  disabled={selectedProduct.is_soldout}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  장바구니
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={selectedProduct.is_soldout}
                  style={{ flex: 1 }}
                >
                  바로구매
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sections */}
        <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>배송정보</h3>
            <div style={{ color: '#666', lineHeight: '1.8' }}>
              <p>• 배송료: 3,000원 (50,000원 이상 무료배송)</p>
              <p>• 배송기간: 주문 후 1~2일 내 배송</p>
              <p>• 주말/공휴일 제외</p>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>교환/환불</h3>
            <div style={{ color: '#666', lineHeight: '1.8' }}>
              <p>• 상품 수령 후 7일 이내 교환/환불 가능</p>
              <p>• 미개봉 상태의 상품에 한함</p>
              <p>• 배송료는 고객 부담</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
