import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock3, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { apiDeleteAdminNotice, apiGetAdminNotice, type NoticeDetail } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AdminNoticeDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const noticeId = Number(params.id);
  const { adminSession, accessToken } = useAdminAuthStore();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      setError('잘못된 공지 ID입니다.');
      setLoading(false);
      return;
    }
    if (!adminSession || !accessToken) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError('');

    apiGetAdminNotice(accessToken, noticeId)
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
  }, [accessToken, adminSession, noticeId]);

  const handleDelete = async () => {
    if (!adminSession || !accessToken || !notice) return;
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) return;

    setActionLoading(true);
    try {
      await apiDeleteAdminNotice(accessToken, notice.id);
      navigate('/admin/cs/notices', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '공지 삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!adminSession) return null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          to="/admin/cs/notices"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  borderRadius: 999,
                  background: notice.pinned ? '#0f172a' : '#e2e8f0',
                  color: notice.pinned ? '#fff' : '#475569',
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {notice.pinned ? '고정 공지' : '일반 공지'}
              </span>
              <span style={{ color: '#64748b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Clock3 size={14} />
                {formatLocalDateTime(notice.createdAt)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to={`/admin/cs/notices/${notice.id}/edit`}
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
                <Pencil size={14} />
                수정
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={actionLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 12,
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  padding: '10px 12px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  color: '#be123c',
                  fontWeight: 700,
                }}
              >
                <Trash2 size={14} />
                삭제
              </button>
            </div>
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
