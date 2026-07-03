import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
      <Link to="/">
        <Button variant="outline">홈으로</Button>
      </Link>
    </div>
  );
}
