import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, RefreshCw, Sparkles, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  apiCreateAdminQnaAiSummary,
  apiCreateAdminQnaAnswer,
  apiGetAdminQna,
  apiGetAdminQnas,
  type QnaDetail,
  type QnaSummary,
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

export default function AdminQnaPage() {
  const { adminSession, accessToken } = useAdminAuthStore();
  const [qnas, setQnas] = useState<QnaSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<QnaDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ANSWERED'>('ALL');
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSuggestedAnswer, setAiSuggestedAnswer] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const clearAiDraft = () => {
    setAiSummary('');
    setAiSuggestedAnswer('');
  };

  const orderedQnas = useMemo(
    () => [...qnas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [qnas]
  );

  const visibleQnas = useMemo(() => {
    if (statusFilter === 'ALL') return orderedQnas;
    if (statusFilter === 'PENDING') return orderedQnas.filter((qna) => !qna.answered);
    return orderedQnas.filter((qna) => qna.answered);
  }, [orderedQnas, statusFilter]);

  useEffect(() => {
    if (!accessToken || !adminSession) return;

    let alive = true;
    setListLoading(true);
    setError('');

    apiGetAdminQnas(accessToken)
      .then((items) => {
        if (!alive) return;
        setQnas(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setQnas([]);
        setError(e.message ?? '문의 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setListLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, adminSession]);

  useEffect(() => {
    if (!accessToken || !selectedId) return;

    let alive = true;
    setDetailLoading(true);
    setSelectedDetail(null);
    setAnswer('');
    clearAiDraft();

    apiGetAdminQna(accessToken, selectedId)
      .then((item) => {
        if (!alive) return;
        setSelectedDetail(item);
        setAnswer(item.answerContent ?? '');
        if (item.answered) clearAiDraft();
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '문의 상세를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, selectedId]);

  const refreshList = async () => {
    if (!accessToken) return;
    const items = await apiGetAdminQnas(accessToken);
    setQnas(items);
    setSelectedId((current) => current ?? items[0]?.id ?? null);
  };

  const handleAiRecommendation = async () => {
    if (!accessToken || !selectedDetail) return;
    setAiLoading(true);
    setError('');

    try {
      const response = await apiCreateAdminQnaAiSummary(accessToken, selectedDetail.id, {
        title: selectedDetail.title,
        content: selectedDetail.content,
        type: selectedDetail.type,
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
    if (!accessToken || !selectedDetail) return;
    if (!answer.trim()) {
      setToast({ message: '답변 내용을 입력하세요.', type: 'error' });
      return;
    }
    if (selectedDetail.answered) {
      setToast({ message: '이미 답변한 문의입니다.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiCreateAdminQnaAnswer(accessToken, selectedDetail.id, { content: answer.trim() });
      setToast({ message: '답변이 등록되었습니다.', type: 'success' });
      await refreshList();
      const updated = await apiGetAdminQna(accessToken, selectedDetail.id);
      setSelectedDetail(updated);
      setAnswer(updated.answerContent ?? '');
      clearAiDraft();
    } catch (e) {
      const message = e instanceof Error ? e.message : '답변 등록에 실패했습니다.';
      setToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!adminSession) return null;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0 }}>문의 관리</h1>
            <p style={{ marginTop: 6, fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              문의 목록과 답변 등록을 처리하는 관리자 화면입니다. AI 요약은 답변 초안으로만 사용하세요.
            </p>
          </div>
          <Button onClick={() => void refreshList()}>새로고침</Button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              minWidth: 160,
              background: statusFilter === 'ALL' ? '#f9fafb' : 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            전체 문의
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              minWidth: 160,
              background: statusFilter === 'PENDING' ? '#f9fafb' : 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            답변 대기
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ANSWERED')}
            style={{
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              minWidth: 160,
              background: statusFilter === 'ANSWERED' ? '#f9fafb' : 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            답변 완료
          </button>
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)', gap: 20 }}>
          <section style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 20px',
                borderBottom: '1px solid #eef2f7',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>문의 목록</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>최신 문의가 위에 표시됩니다.</div>
              </div>
              <button
                type="button"
                onClick={() => void refreshList()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 12,
                  border: '1px solid #dbe3ee',
                  background: '#fff',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                <RefreshCw size={14} />
                새로고침
              </button>
            </div>

            <div style={{ maxHeight: 680, overflowY: 'auto' }}>
              {listLoading ? (
                <div style={{ padding: 24, color: '#64748b' }}>문의 목록을 불러오는 중...</div>
              ) : visibleQnas.length === 0 ? (
                <div style={{ padding: 24, color: '#64748b' }}>등록된 문의가 없습니다.</div>
              ) : (
                visibleQnas.map((qna) => {
                  const active = qna.id === selectedId;
                  return (
                    <button
                      key={qna.id}
                      type="button"
                      onClick={() => setSelectedId(qna.id)}
                      style={{
                        width: '100%',
                        display: 'block',
                        border: 'none',
                        borderTop: '1px solid #eef2f7',
                        background: active ? '#f8fafc' : '#fff',
                        padding: '16px 20px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div
                          style={{
                            borderRadius: 999,
                            background: qna.answered ? '#dcfce7' : '#fff7ed',
                            color: qna.answered ? '#166534' : '#c2410c',
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            height: 'fit-content',
                          }}
                        >
                          {qna.answered ? '답변완료' : '대기중'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: active ? 800 : 700, color: '#0f172a', lineHeight: 1.5 }}>
                            [{QNA_TYPE_LABEL[qna.type]}] {qna.title}
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: '#64748b',
                              fontSize: 12,
                            }}
                          >
                            <Clock3 size={13} />
                            {formatLocalDateTime(qna.createdAt)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section
            style={{
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              background: '#fff',
              padding: 24,
              minHeight: 300,
            }}
          >
            {detailLoading ? (
              <div style={{ color: '#64748b' }}>문의 상세를 불러오는 중...</div>
            ) : selectedDetail ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        borderRadius: 999,
                        background: selectedDetail.answered ? '#dcfce7' : '#fff7ed',
                        color: selectedDetail.answered ? '#166534' : '#c2410c',
                        padding: '5px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {selectedDetail.answered ? '답변완료' : '대기중'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 13 }}>
                      {formatLocalDateTime(selectedDetail.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void refreshList()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 12,
                      border: '1px solid #dbe3ee',
                      background: '#fff',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    <RefreshCw size={14} />
                    상태 갱신
                  </button>
                </div>

                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                  [{QNA_TYPE_LABEL[selectedDetail.type]}] {selectedDetail.title}
                </h2>

                <div
                  style={{
                    marginTop: 20,
                    borderTop: '1px solid #eef2f7',
                    paddingTop: 20,
                    lineHeight: 1.9,
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    fontSize: 15,
                  }}
                >
                  {selectedDetail.content}
                </div>

                {(aiSummary || aiSuggestedAnswer) && (
                  <div
                    style={{
                      marginTop: 20,
                      borderRadius: 16,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>AI 요약</div>
                    {aiSummary && (
                      <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                        {aiSummary}
                      </div>
                    )}
                    {aiSuggestedAnswer && (
                      <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>답변 초안</div>
                        {aiSuggestedAnswer}
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 16,
                    border: '1px solid #dbe3ee',
                    background: '#f8fafc',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    첨부파일
                  </div>
                  {selectedDetail.attachmentUrl ? (
                    <a href={selectedDetail.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontSize: 14 }}>
                      {getDisplayFileName(selectedDetail.attachmentUrl)}
                    </a>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: 14 }}>첨부 파일 없음</span>
                  )}
                </div>

                {selectedDetail.answerContent && (
                  <div
                    style={{
                      marginTop: 20,
                      borderRadius: 16,
                      borderLeft: '4px solid #0f172a',
                      background: '#f8fafc',
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                      기존 답변
                    </div>
                    <div style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {selectedDetail.answerContent}
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
                      disabled={selectedDetail.answered || submitting}
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: '1px solid #dbe3ee',
                        padding: 14,
                        fontSize: 14,
                        lineHeight: 1.7,
                        resize: 'vertical',
                        background: selectedDetail.answered ? '#f8fafc' : '#fff',
                      }}
                    />
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => void handleAiRecommendation()}
                      disabled={aiLoading || selectedDetail.answered}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 12,
                        border: '1px solid #dbe3ee',
                        background: '#fff',
                        padding: '10px 12px',
                        cursor: aiLoading || selectedDetail.answered ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      <Sparkles size={14} />
                      {aiLoading ? '요약 생성 중...' : 'AI 요약 받기'}
                    </button>

                    <Button onClick={() => void handleSubmitAnswer()} type="button" disabled={submitting || selectedDetail.answered}>
                      <Send size={16} />
                      {submitting ? '저장 중...' : '답변 등록'}
                    </Button>
                  </div>
                </div>

                <div style={{ marginTop: 18, fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <UserRound size={14} />
                    관리 가이드
                  </div>
                  AI 요약은 참고용입니다. 최종 답변은 관리자가 문맥에 맞게 수정한 뒤 등록하세요.
                </div>
              </>
            ) : (
              <div style={{ color: '#64748b' }}>왼쪽 목록에서 문의를 선택하세요.</div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
