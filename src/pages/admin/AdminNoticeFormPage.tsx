import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  apiCreateAdminNotice,
  apiGetAdminNotice,
  apiUpdateAdminNotice,
  type NoticeDetail,
} from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function AdminNoticeFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const noticeId = params.id ? Number(params.id) : null;
  const isEdit = Number.isFinite(noticeId) && Boolean(noticeId);
  const { adminSession, accessToken } = useAdminAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(Boolean(isEdit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isEdit || !noticeId || !adminSession || !accessToken) {
      if (!isEdit) setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError('');

    apiGetAdminNotice(accessToken, noticeId)
      .then((item: NoticeDetail) => {
        if (!alive) return;
        setTitle(item.title);
        setContent(item.content);
        setPinned(item.pinned);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '공지 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, adminSession, isEdit, noticeId]);

  const handleSubmit = async () => {
    if (!adminSession || !accessToken) return;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      setError('제목과 본문을 입력하세요.');
      return;
    }
    if (trimmedTitle.length > 50) {
      setError('제목은 50자 이하여야 합니다.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { title: trimmedTitle, content: trimmedContent, pinned };
      const saved = isEdit && noticeId
        ? await apiUpdateAdminNotice(accessToken, noticeId, payload)
        : await apiCreateAdminNotice(accessToken, payload);
      setToast({ message: isEdit ? '공지 수정 완료' : '공지 등록 완료', type: 'success' });
      navigate(`/admin/cs/notices/${saved.id}`, { replace: true });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : '저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!adminSession) return null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          to={isEdit && noticeId ? `/admin/cs/notices/${noticeId}` : '/admin/cs/notices'}
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

      {error && (
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 14,
            border: '1px solid #fecaca',
            background: '#fff1f2',
            padding: '14px 16px',
            color: '#be123c',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, color: '#64748b' }}>공지 정보를 불러오는 중...</div>
      ) : (
        <section style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
              {isEdit ? '공지 수정' : '공지 등록'}
            </h1>
            <p style={{ marginTop: 6, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              제목, 본문, 고정 여부를 모두 입력해야 합니다.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                placeholder="공지 제목"
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: '12px 14px',
                  fontSize: 14,
                  background: '#fff',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>본문</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="공지 본문"
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  background: '#fff',
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                style={{ height: 16, width: 16 }}
              />
              고정 공지로 상단 노출
            </label>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => void handleSubmit()} type="button" disabled={saving}>
              <Save size={16} />
              {saving ? '저장 중...' : isEdit ? '수정 저장' : '공지 등록'}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
