import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useOrderStore } from '@/stores/orderStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { items: cartItems, getTotalPrice, clearCart } = useCartStore();
  const { addresses, getDefaultAddress } = useDeliveryStore();
  const { addOrder } = useOrderStore();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState({
    receiver_name: '',
    receiver_phone: '',
    zipcode: '',
    address: '',
    detail_address: '',
  });
  const [deliveryRequest, setDeliveryRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!session) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
    }
    if (cartItems.length === 0) {
      setToast({ message: '장바구니가 비어있습니다.', type: 'error' });
      setTimeout(() => navigate('/cart'), 2000);
    }

    // Set default address
    const defaultAddr = getDefaultAddress();
    if (defaultAddr && addresses.length > 0) {
      setSelectedAddressId(defaultAddr.id);
    }
  }, [session, cartItems.length, navigate, addresses, getDefaultAddress]);

  if (!session || cartItems.length === 0) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>
      </>
    );
  }

  const productAmount = getTotalPrice();
  const shippingFee = productAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const finalAmount = productAmount + shippingFee;

  const selectedAddr = !useCustomAddress && selectedAddressId ? addresses.find((a) => a.id === selectedAddressId) : null;

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
    setUseCustomAddress(false);
  };

  const handlePayment = async () => {
    // Validate address
    if (useCustomAddress) {
      if (!customAddress.receiver_name.trim()) {
        setToast({ message: '수령인을 입력해주세요.', type: 'error' });
        return;
      }
      if (!customAddress.receiver_phone.trim()) {
        setToast({ message: '연락처를 입력해주세요.', type: 'error' });
        return;
      }
      if (!customAddress.zipcode.trim()) {
        setToast({ message: '우편번호를 입력해주세요.', type: 'error' });
        return;
      }
      if (!customAddress.address.trim()) {
        setToast({ message: '주소를 입력해주세요.', type: 'error' });
        return;
      }
    } else if (!selectedAddr) {
      setToast({ message: '배송지를 선택해주세요.', type: 'error' });
      return;
    }

    setIsProcessing(true);

    // Mock payment
    setTimeout(() => {
      const orderNumber = `ORD-${Date.now()}`;
      const shippingData = useCustomAddress
        ? customAddress
        : {
            receiver_name: selectedAddr!.receiver_name,
            receiver_phone: selectedAddr!.receiver_phone,
            zipcode: selectedAddr!.zipcode,
            address: selectedAddr!.address,
            detail_address: selectedAddr!.detail_address,
          };

      addOrder({
        order_number: orderNumber,
        product_amount: productAmount,
        shipping_fee: shippingFee,
        discount_amount: 0,
        final_amount: finalAmount,
        status: 'PAYMENT_COMPLETED',
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
        })),
        shipping: {
          ...shippingData,
          delivery_request: deliveryRequest,
        },
      });

      clearCart();
      setIsProcessing(false);
      setToast({ message: '주문이 완료되었습니다.', type: 'success' });
      setTimeout(() => navigate('/mypage/orders'), 2000);
    }, 1500);
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
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>주문 정보 입력</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
          {/* Main */}
          <div>
            {/* Order Items */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>주문 상품</h2>
              <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                {cartItems.map((item, idx) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 60px 80px',
                      gap: '12px',
                      padding: '16px',
                      borderBottom: idx < cartItems.length - 1 ? '1px solid #eee' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.product_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>₩{item.price.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#666' }}>×{item.quantity}</div>
                    <div style={{ textAlign: 'right', fontWeight: '600' }}>
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping Address */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>배송지</h2>

              {/* Saved Addresses */}
              {addresses.length > 0 && !useCustomAddress && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                    저장된 배송지
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          border: selectedAddressId === addr.id ? '2px solid #333' : '1px solid #eee',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: selectedAddressId === addr.id ? '#f5f5f5' : 'white',
                        }}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleSelectAddress(addr.id)}
                          style={{ cursor: 'pointer', marginTop: '2px' }}
                        />
                        <div style={{ fontSize: '14px', flex: 1 }}>
                          <div style={{ fontWeight: '600' }}>
                            {addr.name}
                            {addr.is_default && (
                              <span style={{ fontSize: '11px', marginLeft: '8px', color: '#666' }}>
                                (기본)
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#666', marginTop: '4px' }}>
                            {addr.receiver_name} | {addr.receiver_phone}
                          </div>
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                            [{addr.zipcode}] {addr.address} {addr.detail_address}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle Custom Address */}
              <button
                onClick={() => setUseCustomAddress(!useCustomAddress)}
                style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {useCustomAddress ? '저장된 배송지 사용' : '다른 배송지 입력'}
              </button>

              {/* Custom Address Form */}
              {useCustomAddress && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                      수령인 *
                    </label>
                    <input
                      type="text"
                      value={customAddress.receiver_name}
                      onChange={(e) => setCustomAddress({ ...customAddress, receiver_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      value={customAddress.receiver_phone}
                      onChange={(e) => setCustomAddress({ ...customAddress, receiver_phone: e.target.value })}
                      placeholder="01012345678"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                      우편번호 *
                    </label>
                    <input
                      type="text"
                      value={customAddress.zipcode}
                      onChange={(e) => setCustomAddress({ ...customAddress, zipcode: e.target.value })}
                      placeholder="12345"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div></div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                      주소 *
                    </label>
                    <input
                      type="text"
                      value={customAddress.address}
                      onChange={(e) => setCustomAddress({ ...customAddress, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                      상세주소
                    </label>
                    <input
                      type="text"
                      value={customAddress.detail_address}
                      onChange={(e) => setCustomAddress({ ...customAddress, detail_address: e.target.value })}
                      placeholder="건물명, 호수 등"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Delivery Request */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>배송 요청사항</h2>
              <textarea
                value={deliveryRequest}
                onChange={(e) => setDeliveryRequest(e.target.value)}
                placeholder="배송 시 특별한 요청사항이 있으면 입력해주세요."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </section>
          </div>

          {/* Summary */}
          <div>
            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '20px',
                height: 'fit-content',
                position: 'sticky',
                top: '24px',
              }}
            >
              <h3 style={{ fontWeight: 'bold', marginBottom: '20px', fontSize: '16px' }}>결제 정보</h3>

              <div style={{ marginBottom: '20px' }}>
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
                  <span>₩{productAmount.toLocaleString()}</span>
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
                  <span>₩{shippingFee.toLocaleString()}</span>
                </div>
                {productAmount >= FREE_SHIPPING_THRESHOLD && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#27ae60',
                    }}
                  >
                    <span>무료배송 적용</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '2px solid #eee',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                }}
              >
                <span>최종 결제금액</span>
                <span>₩{finalAmount.toLocaleString()}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                style={{ width: '100%', opacity: isProcessing ? 0.6 : 1 }}
              >
                {isProcessing ? '결제 진행중...' : '결제하기'}
              </Button>

              <button
                onClick={() => navigate('/cart')}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                장바구니로
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
