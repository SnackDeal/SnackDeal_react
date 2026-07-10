import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock3, Plus } from 'lucide-react';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';
import { CustomerSupportHero } from '@/components/common/CustomerSupportHero';
import { apiGetMyQnas, apiGetPublicFaqs, type PublicFaq, type QnaSummary } from '@/lib/api';
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

export default function QnaListPage() {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const [tab, setTab] = useState<'faq' | 'qna'>('faq');
  const [faqType, setFaqType] = useState<'ALL' | QnaType>('ALL');
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqError, setFaqError] = useState('');
  const [qnas, setQnas] = useState<QnaSummary[]>([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaError, setQnaError] = useState('');
  const [qnaPage, setQnaPage] = useState(0);
  const [qnaPageSize, setQnaPageSize] = useState<AdminPageSize>(10);

  const faqTypeOptions = [
    { value: 'ALL', label: '전체' },
    { value: 'ORDER', label: '주문' },
    { value: 'SHIPPING', label: '배송' },
    { value: 'PRODUCT', label: '상품' },
    { value: 'OTHER', label: '기타' },
  ] as const;

  const orderedQnas = useMemo(
    () => [...qnas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [qnas]
  );
  const qnaTotalPages = Math.max(Math.ceil(orderedQnas.length / qnaPageSize), 1);
  const qnaClampedPage = Math.min(qnaPage, qnaTotalPages - 1);
  const qnaPageItems = orderedQnas.slice(
    qnaClampedPage * qnaPageSize,
    qnaClampedPage * qnaPageSize + qnaPageSize
  );

  useEffect(() => {
    let alive = true;
    setFaqLoading(true);
    setFaqError('');

    apiGetPublicFaqs(faqType === 'ALL' ? undefined : faqType)
      .then((items) => {
        if (alive) setFaqs(items);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setFaqs([]);
        setFaqError(e.message ?? 'FAQ를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setFaqLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [faqType]);

  useEffect(() => {
    if (!accessToken || !member) {
      setQnas([]);
      return;
    }

    let alive = true;
    setQnaLoading(true);
    setQnaError('');

    apiGetMyQnas(accessToken)
      .then((items) => {
        if (!alive) return;
        setQnas(items);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setQnas([]);
        setQnaError(e.message ?? '문의 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setQnaLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [accessToken, member]);

  useEffect(() => {
    setQnaPage(0);
  }, [qnaPageSize]);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 48px' }}>
      <CustomerSupportHero
        section="qna"
        description="FAQ와 1:1 문의를 같은 페이지에서 확인할 수 있습니다."
        title="문의게시판"
      />

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        <button
          type="button"
          onClick={() => setTab('faq')}
          style={{
            padding: '14px 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: tab === 'faq' ? 800 : 600,
            borderBottom: tab === 'faq' ? '2px solid #0f172a' : '2px solid transparent',
            color: tab === 'faq' ? '#0f172a' : '#64748b',
          }}
        >
          FAQ
        </button>
        <button
          type="button"
          onClick={() => setTab('qna')}
          style={{
            padding: '14px 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: tab === 'qna' ? 800 : 600,
            borderBottom: tab === 'qna' ? '2px solid #0f172a' : '2px solid transparent',
            color: tab === 'qna' ? '#0f172a' : '#64748b',
          }}
        >
          1:1 문의
        </button>
      </div>

      {tab === 'faq' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {faqTypeOptions.map((option) => {
              const active = faqType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFaqType(option.value)}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid',
                    borderColor: active ? '#0f172a' : '#dbe3ee',
                    borderRadius: 999,
                    background: active ? '#0f172a' : '#fff',
                    color: active ? '#fff' : '#475569',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {faqLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b', border: '1px solid #e5e7eb', borderRadius: 16 }}>
                FAQ를 불러오는 중...
              </div>
            ) : faqError ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#be123c', border: '1px solid #fecaca', borderRadius: 16, background: '#fff1f2' }}>
                {faqError}
              </div>
            ) : faqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b', border: '1px solid #e5e7eb', borderRadius: 16 }}>
                선택한 카테고리의 FAQ가 없습니다.
              </div>
            ) : (
              faqs.map((faq) => (
                <details
                  key={faq.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: '16px 18px',
                    background: '#fff',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 700, userSelect: 'none', color: '#0f172a' }}>
                    [{QNA_TYPES.find((t) => t.value === faq.type)?.label}] {faq.title}
                  </summary>
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid #eef2f7',
                      color: '#334155',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {faq.content}
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'qna' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: '#64748b', fontSize: 14 }}>
              문의를 클릭하면 상세 페이지로 이동합니다.
            </div>
            <Link
              to="/cs/qna/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                background: '#0f172a',
                color: '#fff',
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Plus size={16} />
              문의 작성
            </Link>
          </div>

          <div style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #eef2f7' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>내 문의</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>문의 목록만 표시하고 상세는 별도 페이지에서 봅니다.</div>
            </div>

            <div style={{ maxHeight: 640, overflowY: 'auto' }}>
              {!member ? (
                <div style={{ padding: 24, color: '#64748b', lineHeight: 1.8 }}>
                  로그인하면 문의 내역을 확인할 수 있습니다.
                </div>
              ) : qnaLoading ? (
                <div style={{ padding: 24, color: '#64748b' }}>문의 목록을 불러오는 중...</div>
              ) : qnaError ? (
                <div style={{ padding: 24, color: '#be123c', lineHeight: 1.8 }}>{qnaError}</div>
              ) : orderedQnas.length === 0 ? (
                <div style={{ padding: 24, color: '#64748b', lineHeight: 1.8 }}>
                  아직 등록된 문의가 없습니다.
                </div>
              ) : (
                qnaPageItems.map((qna) => (
                  <button
                    key={qna.id}
                    type="button"
                    onClick={() => navigate(`/cs/qna/${qna.id}`)}
                    style={{
                      width: '100%',
                      display: 'block',
                      border: 'none',
                      borderTop: '1px solid #eef2f7',
                      background: '#fff',
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
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                          [{QNA_TYPES.find((t) => t.value === qna.type)?.label}] {qna.title}
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
                ))
              )}
            </div>
          </div>

          <AdminPagination
            page={qnaClampedPage}
            totalPages={qnaTotalPages}
            total={orderedQnas.length}
            pageSize={qnaPageSize}
            onPageChange={setQnaPage}
            onPageSizeChange={setQnaPageSize}
            unitLabel="건"
          />
        </div>
      )}
    </div>
  );
}
