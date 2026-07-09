import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock3, Paperclip, RefreshCw, UserRound } from 'lucide-react';
import { CustomerSupportHero } from '@/components/common/CustomerSupportHero';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { apiDeleteMyQna, apiGetMyQna, type QnaDetail } from '@/lib/api';
import { getDisplayFileName } from '@/lib/imageFile';
import { useAuthStore } from '@/stores/authStore';
import type { QnaType } from '@/types';

const QNA_TYPES: Array<{ value: QnaType; label: string }> = [
  { value: 'ORDER', label: '주문' },
  { value: 'SHIPPING', label: '배송' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'OTHER', label: '기타' },
];

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function QnaDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const qnaId = Number(params.id);
  const { member, accessToken } = useAuthStore();
  const [detail, setDetail] = useState<QnaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(qnaId) || qnaId <= 0) {
      setError('잘못된 문의 ID입니다.');
      setLoading(false);
      return;
    }
    if (!accessToken || !member) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError('');

    apiGetMyQna(accessToken, qnaId)
      .then((item) => {
        if (alive) setDetail(item);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '문의 상세를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, member, qnaId]);

  const handleDelete = async () => {
    if (!accessToken || !detail) return;
    if (!window.confirm('이 문의를 삭제하시겠습니까?')) return;

    setActionLoading(true);
    try {
      await apiDeleteMyQna(accessToken, detail.id);
      setToast({ message: '문의가 삭제되었습니다.', type: 'success' });
      setTimeout(() => navigate('/cs/qna', { replace: true }), 300);
    } catch (e) {
      const message = e instanceof Error ? e.message : '삭제에 실패했습니다.';
      setToast({ message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <CustomerSupportHero
        section="qna"
        description="문의 상세와 답변 상태를 확인할 수 있습니다."
        title="문의 상세"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to="/cs/qna"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                border: '1px solid #dbe3ee',
                background: '#fff',
                padding: '10px 12px',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              <ArrowLeft size={16} />
              목록으로
            </Link>
            <button
              type="button"
              onClick={() => void navigate(0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                border: '1px solid #dbe3ee',
                background: '#fff',
                padding: '10px 12px',
                cursor: 'pointer',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              <RefreshCw size={14} />
              새로고침
            </button>
          </div>
        }
      />

      {!member ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: 24,
            color: '#64748b',
            lineHeight: 1.8,
          }}
        >
          로그인한 회원만 문의 상세를 확인할 수 있습니다.
        </div>
      ) : error ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #fecaca',
            background: '#fff1f2',
            padding: 18,
            color: '#be123c',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div style={{ padding: 24, color: '#64748b' }}>문의 상세를 불러오는 중...</div>
      ) : detail ? (
        <article
          style={{
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  borderRadius: 999,
                  background: detail.answered ? '#dcfce7' : '#fff7ed',
                  color: detail.answered ? '#166534' : '#c2410c',
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {detail.answered ? '답변완료' : '대기중'}
              </span>
              <span style={{ color: '#64748b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Clock3 size={14} />
                {formatLocalDateTime(detail.createdAt)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate(`/cs/qna/new?id=${detail.id}`)} type="button" disabled={detail.answered || actionLoading}>
                수정
              </Button>
              <Button onClick={() => void handleDelete()} type="button" disabled={detail.answered || actionLoading}>
                삭제
              </Button>
            </div>
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            [{QNA_TYPES.find((t) => t.value === detail.type)?.label}] {detail.title}
          </h1>

          <div
            style={{
              marginTop: 24,
              borderTop: '1px solid #eef2f7',
              paddingTop: 24,
              lineHeight: 1.9,
              color: '#334155',
              whiteSpace: 'pre-wrap',
              fontSize: 15,
            }}
          >
            {detail.content}
          </div>

          <div
            style={{
              marginTop: 20,
              borderRadius: 16,
              border: '1px solid #dbe3ee',
              background: '#f8fafc',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Paperclip size={14} />
              첨부파일
            </div>
            {detail.attachmentUrl ? (
              <a href={detail.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontSize: 14 }}>
                {getDisplayFileName(detail.attachmentUrl)}
              </a>
            ) : (
              <span style={{ color: '#64748b', fontSize: 14 }}>첨부 파일 없음</span>
            )}
          </div>

          {detail.answerContent && (
            <div
              style={{
                marginTop: 20,
                borderRadius: 16,
                borderLeft: '4px solid #0f172a',
                background: '#f8fafc',
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserRound size={14} />
                관리자 답변
              </div>
              <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {detail.answerContent}
              </div>
            </div>
          )}
        </article>
      ) : null}
    </div>
  );
}
