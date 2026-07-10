import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock3, Pin, RefreshCw } from 'lucide-react';
import { CustomerSupportHero } from '@/components/common/CustomerSupportHero';
import { apiGetPublicNotice, type NoticeDetail } from '@/lib/api';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function NoticeDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const noticeId = Number(params.id);
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      setError('잘못된 공지 ID입니다.');
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError('');

    apiGetPublicNotice(noticeId)
      .then((item) => {
        if (alive) setNotice(item);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '공지 상세를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [noticeId]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      <CustomerSupportHero
        section="notice"
        description="공지 상세를 확인하고 목록으로 돌아갈 수 있습니다."
        title="공지사항"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to="/cs/notice"
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

      {error ? (
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
        <div style={{ padding: 24, color: '#64748b' }}>공지 상세를 불러오는 중...</div>
      ) : notice ? (
        <article
          style={{
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                background: notice.pinned ? '#0f172a' : '#e2e8f0',
                color: notice.pinned ? '#fff' : '#475569',
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Pin size={14} />
              {notice.pinned ? '고정 공지' : '일반 공지'}
            </span>
            <span style={{ color: '#64748b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock3 size={14} />
              {formatLocalDateTime(notice.createdAt)}
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            {notice.title}
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
            {notice.content}
          </div>
        </article>
      ) : null}
    </div>
  );
}
