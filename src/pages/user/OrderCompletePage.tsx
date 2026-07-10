import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OrderCompletePage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <CheckCircle2 size={64} color="#16a34a" style={{ margin: '0 auto 20px' }} />
      <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '12px' }}>주문이 완료되었습니다</h1>
      <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '32px' }}>
        결제가 정상적으로 처리되었습니다. 주문 상태와 배송 진행 상황은 주문내역에서 확인할 수 있습니다.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Link to="/mypage/orders">
          <Button>주문내역 확인</Button>
        </Link>
        {orderId && (
          <Link to={`/mypage/orders/${orderId}`}>
            <Button variant="secondary">주문 상세 보기</Button>
          </Link>
        )}
        <Link to="/product">
          <Button variant="outline">계속 쇼핑하기</Button>
        </Link>
      </div>
    </div>
  );
}
