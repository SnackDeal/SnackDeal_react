import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useDeliveryStore } from '@/stores/deliveryStore';
import {
  apiCompleteOrder,
  apiGetMyCoupons,
  apiGetProduct,
  apiGetPublicShippingPolicy,
  apiPrepareOrder,
  type MyCoupon,
  type OrderPrepareResponse,
  type ShippingPolicy,
} from '@/lib/api';
import { getShippingFeeForAmount } from '@/lib/shipping';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import type { CartItem } from '@/stores/cartStore';

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: {
        storeId: string;
        channelKey: string;
        paymentId: string;
        orderName: string;
        totalAmount: number;
        currency: string;
        payMethod?: string;
        customer?: {
          fullName?: string;
          email?: string;
          phoneNumber?: string;
        };
      }) => Promise<{ code?: string; message?: string; paymentId?: string }>;
    };
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const { items: cartItems, removeItems } = useCartStore();
  const patchCartItem = (productId: number, patch: Partial<CartItem>) => {
    useCartStore.setState((state) => ({
      items: state.items.map((i) => (i.product_id === productId ? { ...i, ...patch } : i)),
    }));
  };
  const { addresses, getDefaultAddress } = useDeliveryStore();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryRequest, setDeliveryRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy | null>(null);
  const [isShippingPolicyLoading, setIsShippingPolicyLoading] = useState(true);
  const [syncedItems, setSyncedItems] = useState<CartItem[] | null>(null);
  const [priceChanges, setPriceChanges] = useState<
    { productId: number; name: string; oldPrice: number; newPrice: number }[]
  >([]);
  const [priceConfirmed, setPriceConfirmed] = useState(false);
  const [isPriceSyncing, setIsPriceSyncing] = useState(true);
  const checkoutProductIds = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('checkout-product-ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }, []);
  const directCheckoutItems = useMemo<CartItem[]>(() => {
    try {
      const raw = sessionStorage.getItem('checkout-direct-items');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  const checkoutItems =
    directCheckoutItems.length > 0
      ? directCheckoutItems
      : cartItems.filter((item) => checkoutProductIds.includes(item.product_id));

  useEffect(() => {
    if (isPaymentCompleted) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!member) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      timers.push(setTimeout(() => navigate('/login'), 2000));
    }
    if (checkoutItems.length === 0) {
      setToast({ message: '장바구니가 비어있습니다.', type: 'error' });
      timers.push(setTimeout(() => navigate('/cart'), 2000));
    }

    // Set default address
    const defaultAddr = getDefaultAddress();
    if (defaultAddr && addresses.length > 0) {
      setSelectedAddressId(defaultAddr.id);
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [member, checkoutItems.length, navigate, addresses, getDefaultAddress, isPaymentCompleted]);

  useEffect(() => {
    if (!accessToken) {
      setMyCoupons([]);
      setIsCouponsLoading(false);
      return;
    }

    let ignore = false;
    setIsCouponsLoading(true);
    apiGetMyCoupons(accessToken)
      .then((coupons) => {
        if (ignore) return;
        setMyCoupons(coupons.filter((c) => c.status === 'ACTIVE'));
      })
      .catch(() => {
        if (ignore) return;
        setMyCoupons([]);
      })
      .finally(() => {
        if (ignore) return;
        setIsCouponsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let ignore = false;
    setIsShippingPolicyLoading(true);

    apiGetPublicShippingPolicy()
      .then((policy) => {
        if (ignore) return;
        setShippingPolicy(policy);
      })
      .catch(() => {
        if (ignore) return;
        setShippingPolicy(null);
      })
      .finally(() => {
        if (ignore) return;
        setIsShippingPolicyLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const checkoutIdsKey = checkoutItems.map((i) => i.product_id).join(',');
  useEffect(() => {
    if (checkoutItems.length === 0) return;

    let ignore = false;
    setIsPriceSyncing(true);
    setPriceConfirmed(false);
    setPriceChanges([]);

    Promise.all(
      checkoutItems.map((item) =>
        apiGetProduct(item.product_id)
          .then((p) => ({ item, product: p }))
          .catch(() => ({ item, product: null as null }))
      )
    ).then((results) => {
      if (ignore) return;
      const changes: { productId: number; name: string; oldPrice: number; newPrice: number }[] = [];
      const next: CartItem[] = results.map(({ item, product }) => {
        if (!product) return item;
        const priceChanged = product.price !== item.price;
        if (priceChanged) {
          changes.push({
            productId: item.product_id,
            name: product.name || item.product_name,
            oldPrice: item.price,
            newPrice: product.price,
          });
        }
        return {
          ...item,
          product_name: product.name || item.product_name,
          product_image: product.image_url || product.thumbnail_url || item.product_image,
          price: product.price,
          max_stock: product.stock,
          is_soldout: product.is_soldout,
        };
      });
      setSyncedItems(next);
      setPriceChanges(changes);
      setPriceConfirmed(changes.length === 0);
      // 장바구니로 진입한 경우 cartStore 도 최신 상품 정보로 동기화 (직접구매는 세션 데이터라 무시)
      if (directCheckoutItems.length === 0) {
        next.forEach((n) =>
          patchCartItem(n.product_id, {
            product_name: n.product_name,
            product_image: n.product_image,
            price: n.price,
            max_stock: n.max_stock,
            is_soldout: n.is_soldout,
          })
        );
      }
      setIsPriceSyncing(false);
    });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutIdsKey]);

  if (!member || checkoutItems.length === 0) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>리디렉션중...</div>
      </>
    );
  }

  if (isCouponsLoading) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>쿠폰 정보를 불러오는 중...</div>
      </>
    );
  }

  if (isPriceSyncing) {
    return (
      <>
        <div style={{ padding: '40px', textAlign: 'center' }}>상품 가격 확인 중...</div>
      </>
    );
  }

  const displayItems = syncedItems ?? checkoutItems;
  const productAmount = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = getShippingFeeForAmount(shippingPolicy, productAmount);
  const selectedCoupon = myCoupons.find((c) => c.userCouponId === selectedCouponId) ?? null;
  const now = new Date();
  const isCouponUsable = (c: MyCoupon) =>
    productAmount >= c.minOrderPrice &&
    (!c.validUntil || new Date(c.validUntil).getTime() >= now.getTime());
  const discountAmount = (() => {
    if (!selectedCoupon || !isCouponUsable(selectedCoupon)) return 0;
    if (selectedCoupon.discountType === 'FIXED') {
      return Math.min(selectedCoupon.discountValue, productAmount);
    }
    return Math.floor((productAmount * selectedCoupon.discountValue) / 100);
  })();
  const estimatedFinalAmount =
    Math.max(0, productAmount - discountAmount) + Math.max(0, shippingFee);

  const selectedAddr = selectedAddressId ? addresses.find((a) => a.id === selectedAddressId) : null;

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
  };

  const handlePayment = async () => {
    if (!accessToken) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      return;
    }

    if (!selectedAddr) {
      setToast({ message: '배송지를 선택해주세요.', type: 'error' });
      return;
    }

    if (!priceConfirmed) {
      setToast({ message: '변경된 상품 가격을 먼저 확인해주세요.', type: 'error' });
      return;
    }

    setIsProcessing(true);

    try {
      const shippingData = {
        receiver_name: selectedAddr.receiver_name,
        receiver_phone: selectedAddr.receiver_phone,
        zipcode: selectedAddr.zipcode,
        address: selectedAddr.address,
        detail_address: selectedAddr.detail_address,
      };

      const prepared = await apiPrepareOrder(accessToken, {
        items: displayItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        shipping: {
          receiverName: shippingData.receiver_name,
          receiverPhone: shippingData.receiver_phone,
          zipcode: shippingData.zipcode,
          address: shippingData.address,
          detailAddress: shippingData.detail_address,
          deliveryRequest,
        },
        userCouponId: selectedCouponId,
        shippingFee,
      });

      await requestPortOnePayment(prepared, getOrderName(displayItems));
      const completed = await apiCompleteOrder(accessToken, prepared.paymentId);

      setIsPaymentCompleted(true);
      if (directCheckoutItems.length === 0) {
        removeItems(checkoutProductIds);
      }
      sessionStorage.removeItem('checkout-product-ids');
      sessionStorage.removeItem('checkout-direct-items');
      // 재고 갱신 알림 — 홈/상품목록/상세가 최신 재고를 다시 불러오도록
      const stamp = String(Date.now());
      localStorage.setItem('snackdeal-products-updated', stamp);
      window.dispatchEvent(new Event('snackdeal-products-updated'));
      navigate(`/order/complete?orderId=${completed.orderId}`, { replace: true });
    } catch (error) {
      setToast({
        message: (error as { message?: string }).message ?? '결제 처리에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
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
            {priceChanges.length > 0 && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  border: '1px solid #f59e0b',
                  background: '#fffbeb',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '8px', fontSize: '14px' }}>
                  상품 가격이 변경되었습니다
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#78350f' }}>
                  {priceChanges.map((c) => (
                    <li key={c.productId} style={{ marginBottom: '4px' }}>
                      {c.name}: ₩{c.oldPrice.toLocaleString()} → <b>₩{c.newPrice.toLocaleString()}</b>
                    </li>
                  ))}
                </ul>
                {!priceConfirmed && (
                  <button
                    type="button"
                    onClick={() => setPriceConfirmed(true)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#ea580c',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    변경된 가격으로 계속 진행
                  </button>
                )}
              </div>
            )}

            {/* Order Items */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>주문 상품</h2>
              <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                {displayItems.map((item, idx) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 60px 80px',
                      gap: '12px',
                      padding: '16px',
                      borderBottom: idx < displayItems.length - 1 ? '1px solid #eee' : 'none',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>배송지</h2>
                <button
                  type="button"
                  onClick={() => navigate('/mypage/delivery')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  주소록 관리
                </button>
              </div>

              {addresses.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '4px',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    저장된 배송지가 없습니다. 주소록에서 배송지를 먼저 등록해주세요.
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/mypage/delivery')}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#ea580c',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    배송지 등록하러 가기
                  </button>
                </div>
              ) : (
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
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                    쿠폰 사용
                  </label>
                  <select
                    value={selectedCouponId ?? ''}
                    onChange={(e) => setSelectedCouponId(e.target.value ? Number(e.target.value) : null)}
                    disabled={myCoupons.length === 0}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '13px',
                      background: myCoupons.length === 0 ? '#f5f5f5' : 'white',
                    }}
                  >
                    <option value="">
                      {myCoupons.length === 0 ? '사용 가능한 쿠폰이 없습니다' : '쿠폰을 선택하세요'}
                    </option>
                    {myCoupons.map((c) => {
                      const usable = isCouponUsable(c);
                      const suffix = usable
                        ? ''
                        : productAmount < c.minOrderPrice
                          ? ` (최소 ₩${c.minOrderPrice.toLocaleString()})`
                          : ' (기한만료)';
                      const value =
                        c.discountType === 'FIXED'
                          ? `₩${c.discountValue.toLocaleString()} 할인`
                          : `${c.discountValue}% 할인`;
                      return (
                        <option key={c.userCouponId} value={c.userCouponId} disabled={!usable}>
                          {c.couponName} · {value}{suffix}
                        </option>
                      );
                    })}
                  </select>
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
                  <span>{isShippingPolicyLoading ? '계산 중...' : `₩${shippingFee.toLocaleString()}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: '#c62828',
                    }}
                  >
                    <span>예상 쿠폰 할인</span>
                    <span>-₩{discountAmount.toLocaleString()}</span>
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
                <span>예상 결제금액</span>
                <span>₩{estimatedFinalAmount.toLocaleString()}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !priceConfirmed}
                style={{ width: '100%', opacity: isProcessing || !priceConfirmed ? 0.6 : 1 }}
              >
                {isProcessing
                  ? '결제 진행중...'
                  : !priceConfirmed
                    ? '가격 변경 확인 필요'
                    : '결제하기'}
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

function getOrderName(items: CartItem[]) {
  if (items.length === 0) return 'SnackDeal 주문';
  if (items.length === 1) return items[0].product_name;
  return `${items[0].product_name} 외 ${items.length - 1}건`;
}

async function requestPortOnePayment(prepared: OrderPrepareResponse, orderName: string) {
  const payableAmount = resolvePayableAmount(prepared);

  if (payableAmount === 0) {
    return;
  }

  if (!window.PortOne?.requestPayment) {
    throw new Error('결제 SDK가 로드되지 않았습니다. PortOne SDK 설정을 확인해주세요.');
  }

  if (payableAmount < 0) {
    throw new Error('결제 금액이 올바르지 않습니다. 주문 준비 응답을 확인해주세요.');
  }

  if (typeof payableAmount !== 'number' || Number.isNaN(payableAmount)) {
    throw new Error('결제 금액을 확인할 수 없습니다. 주문 준비 응답을 확인해주세요.');
  }

  const payment = await window.PortOne.requestPayment({
    storeId: prepared.storeId,
    channelKey: prepared.channelKey,
    paymentId: prepared.paymentId,
    orderName,
    totalAmount: payableAmount,
    currency: 'CURRENCY_KRW',
    payMethod: 'CARD',
    customer: {
      fullName: prepared.buyerName,
      email: prepared.buyerEmail,
      phoneNumber: prepared.buyerTel,
    },
  });

  if (payment?.code) {
    throw new Error(payment.message ?? '결제가 취소되었거나 실패했습니다.');
  }
}

function resolvePayableAmount(prepared: OrderPrepareResponse) {
  // 서버가 PortOne 에 등록한 금액과 일치해야 PG 가 결제창을 띄움.
  // `amount` 는 통상 PortOne 에 등록된 금액, `finalAmount` 는 서버 내부 최종 계산값.
  if (typeof prepared.amount === 'number' && Number.isFinite(prepared.amount)) {
    return Math.max(0, prepared.amount);
  }

  if (typeof prepared.finalAmount === 'number' && Number.isFinite(prepared.finalAmount)) {
    return Math.max(0, prepared.finalAmount);
  }

  return Number.NaN;
}
