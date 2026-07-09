import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Paperclip, Upload, X } from 'lucide-react';
import { CustomerSupportHero } from '@/components/common/CustomerSupportHero';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { apiCreateMyQna, apiGetMyQna, apiUpdateMyQna, apiUploadFile, type QnaDetail } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { QnaType } from '@/types';

const QNA_TYPES: Array<{ value: QnaType; label: string }> = [
  { value: 'ORDER', label: '주문' },
  { value: 'SHIPPING', label: '배송' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'OTHER', label: '기타' },
];

const EMPTY_FORM = {
  type: 'OTHER' as QnaType,
  title: '',
  content: '',
  attachmentUrl: null as string | null,
};

export function QnaNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { member, accessToken } = useAuthStore();
  const qnaId = useMemo(() => {
    const raw = searchParams.get('id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(Boolean(qnaId));
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<QnaDetail | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);

  const isEditMode = Boolean(qnaId);
  const isAnswered = Boolean(detail?.answered);

  useEffect(() => {
    if (!qnaId || !accessToken) return;

    let alive = true;
    setLoading(true);
    setError('');

    apiGetMyQna(accessToken, qnaId)
      .then((item) => {
        if (!alive) return;
        setDetail(item);
        setForm({
          type: item.type,
          title: item.title,
          content: item.content,
          attachmentUrl: item.attachmentUrl,
        });
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '문의 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, qnaId]);

  const handleUploadAttachment = async (file: File | null) => {
    if (!file || !accessToken) return;
    setUploading(true);
    setError('');

    try {
      const uploaded = await apiUploadFile(accessToken, file, 'qna');
      setForm((prev) => ({ ...prev, attachmentUrl: uploaded.url }));
      setToast({ message: '첨부파일 업로드가 완료되었습니다.', type: 'success' });
    } catch (e) {
      const message = e instanceof Error ? e.message : '파일 업로드에 실패했습니다.';
      setError(message);
      setToast({ message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken || !member) {
      setToast({ message: '로그인이 필요합니다.', type: 'error' });
      navigate('/login');
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: '제목과 내용을 입력해 주세요.', type: 'error' });
      return;
    }

    if (isAnswered) {
      setToast({ message: '답변 완료된 문의는 수정할 수 없습니다.', type: 'error' });
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditMode && qnaId) {
        await apiUpdateMyQna(accessToken, qnaId, form);
        setToast({ message: '문의가 수정되었습니다.', type: 'success' });
      } else {
        await apiCreateMyQna(accessToken, form);
        setToast({ message: '문의가 등록되었습니다.', type: 'success' });
      }
      navigate('/cs/qna', { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : '저장에 실패했습니다.';
      setError(message);
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <CustomerSupportHero
        section="qna"
        description="파일은 먼저 업로드한 뒤 URL로 문의에 함께 저장됩니다."
        title={isEditMode ? '문의 수정' : '문의 작성'}
      />

      {error && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 14,
            border: '1px solid #fecaca',
            background: '#fff1f2',
            padding: '14px 16px',
            color: '#be123c',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, color: '#64748b' }}>문의 정보를 불러오는 중...</div>
      ) : (
        <div
          style={{
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: 24,
          }}
        >
          {isAnswered && (
            <div
              style={{
                marginBottom: 20,
                borderRadius: 14,
                background: '#fef3c7',
                padding: '14px 16px',
                color: '#92400e',
                lineHeight: 1.7,
              }}
            >
              답변이 등록된 문의는 수정할 수 없습니다. 필요하면 새 문의를 작성해 주세요.
            </div>
          )}

          <div style={{ display: 'grid', gap: 18 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>문의 유형</span>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as QnaType }))}
                disabled={isAnswered || saving}
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: '12px 14px',
                  fontSize: 14,
                  background: isAnswered ? '#f8fafc' : '#fff',
                }}
              >
                {QNA_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>제목</span>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={isAnswered || saving}
                maxLength={50}
                placeholder="최대 50자"
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: '12px 14px',
                  fontSize: 14,
                  background: isAnswered ? '#f8fafc' : '#fff',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>내용</span>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                disabled={isAnswered || saving}
                rows={8}
                placeholder="문의 내용을 상세히 입력해 주세요."
                style={{
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  background: isAnswered ? '#f8fafc' : '#fff',
                }}
              />
            </label>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>첨부파일</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>(업로드 후 URL 저장)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                  borderRadius: 14,
                  border: '1px dashed #dbe3ee',
                  padding: 16,
                  background: '#f8fafc',
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 12,
                    background: '#0f172a',
                    color: '#fff',
                    padding: '10px 14px',
                    cursor: uploading || saving || isAnswered ? 'not-allowed' : 'pointer',
                    opacity: uploading || saving || isAnswered ? 0.6 : 1,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Upload size={16} />
                  파일 업로드
                  <input
                    type="file"
                    hidden
                    disabled={uploading || saving || isAnswered}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      void handleUploadAttachment(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>

                {form.attachmentUrl ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 999,
                      background: '#fff',
                      border: '1px solid #dbe3ee',
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#334155',
                    }}
                  >
                    <Paperclip size={14} />
                    <a href={form.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                      첨부파일 확인
                    </a>
                    {!isAnswered && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, attachmentUrl: null }))}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#64748b',
                        }}
                        aria-label="첨부파일 제거"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#64748b', fontSize: 13 }}>첨부파일이 없습니다.</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/cs/qna')} disabled={saving} type="button">
                목록으로
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={saving || uploading || isAnswered} type="button">
                {saving ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 22, fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
            <div>제목은 최대 50자입니다.</div>
            <div>답변 대기 상태에서만 수정이 가능합니다.</div>
            <div>
              저장 후에는 문의 목록에서 상세를 확인할 수 있습니다.{' '}
              <Link to="/cs/qna" style={{ color: '#1d4ed8' }}>
                문의 목록으로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
