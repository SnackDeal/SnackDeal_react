import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock3, Paperclip, RefreshCw, Send, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  apiCreateAdminQnaAiSummary,
  apiCreateAdminQnaAnswer,
  apiGetAdminQna,
  type QnaDetail,
} from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { QNA_TYPE_LABEL } from '@/lib/format';
import { getDisplayFileName } from '@/lib/imageFile';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AdminQnaDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const qnaId = Number(params.id);
  const { adminSession, accessToken } = useAdminAuthStore();
  const [detail, setDetail] = useState<QnaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSuggestedAnswer, setAiSuggestedAnswer] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const clearAiDraft = () => {
    setAiSummary('');
    setAiSuggestedAnswer('');
  };

  useEffect(() => {
    if (!Number.isFinite(qnaId) || qnaId <= 0) {
      setError('잘못된 문의 ID입니다.');
      setLoading(false);
      return;
    }
    if (!accessToken || !adminSession) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError('');
    clearAiDraft();

    apiGetAdminQna(accessToken, qnaId)
      .then((item) => {
        if (!alive) return;
        setDetail(item);
        setAnswer(item.answerContent ?? '');
        if (item.answered) clearAiDraft();
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
  }, [accessToken, adminSession, qnaId]);

  const handleAiRecommendation = async () => {
    if (!accessToken || !detail) return;
    setAiLoading(true);
    setError('');

    try {
      const response = await apiCreateAdminQnaAiSummary(accessToken, detail.id, {
        title: detail.title,
        content: detail.content,
        type: detail.type,
      });
      setAiSummary(response.summary);
      setAiSuggestedAnswer(response.suggestedAnswer);
      setAnswer(response.suggestedAnswer || answer);
      setToast({ message: 'AI 요약을 불러왔습니다. 초안을 확인한 뒤 답변을 수정하세요.', type: 'success' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI 요약을 불러오지 못했습니다.';
      setToast({ message, type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!accessToken || !detail) return;
    if (!answer.trim()) {
      setToast({ message: '답변 내용을 입력하세요.', type: 'error' });
      return;
    }
    if (detail.answered) {
      setToast({ message: '이미 답변한 문의입니다.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiCreateAdminQnaAnswer(accessToken, detail.id, { content: answer.trim() });
      const updated = await apiGetAdminQna(accessToken, detail.id);
      setDetail(updated);
      setAnswer(updated.answerContent ?? '');
      clearAiDraft();
      setToast({ message: '답변이 등록되었습니다.', type: 'success' });
    } catch (e) {
      const message = e instanceof Error ? e.message : '답변 등록에 실패했습니다.';
      setToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          to="/admin/cs/qna"
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

      {!adminSession ? null : error ? (
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
        <article style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', padding: 24 }}>
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
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            [{QNA_TYPE_LABEL[detail.type]}] {detail.title}
          </h1>

          <div style={{ marginTop: 24, borderTop: '1px solid #eef2f7', paddingTop: 24, lineHeight: 1.9, color: '#334155', whiteSpace: 'pre-wrap', fontSize: 15 }}>
            {detail.content}
          </div>

          <div style={{ marginTop: 20, borderRadius: 16, border: '1px solid #dbe3ee', background: '#f8fafc', padding: 16 }}>
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

          {(aiSummary || aiSuggestedAnswer) && (
            <div style={{ marginTop: 20, borderRadius: 16, border: '1px solid #cbd5e1', background: '#f8fafc', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>AI 요약</div>
              {aiSummary && <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{aiSummary}</div>}
              {aiSuggestedAnswer && (
                <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>답변 초안</div>
                  {aiSuggestedAnswer}
                </div>
              )}
            </div>
          )}

          {detail.answerContent && (
            <div style={{ marginTop: 20, borderRadius: 16, borderLeft: '4px solid #0f172a', background: '#f8fafc', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserRound size={14} />
                기존 답변
              </div>
              <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {detail.answerContent}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, borderRadius: 16, border: '1px solid #e2e8f0', padding: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>답변 작성</span>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={7}
                disabled={detail.answered || submitting}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  padding: 14,
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: 'vertical',
                  background: detail.answered ? '#f8fafc' : '#fff',
                }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => void handleAiRecommendation()}
                disabled={aiLoading || detail.answered}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  background: '#fff',
                  padding: '10px 12px',
                  cursor: aiLoading || detail.answered ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                <Sparkles size={14} />
                {aiLoading ? '요약 생성 중...' : 'AI 요약 받기'}
              </button>

              <Button onClick={() => void handleSubmitAnswer()} type="button" disabled={submitting || detail.answered}>
                <Send size={16} />
                {submitting ? '저장 중...' : '답변 등록'}
              </Button>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
