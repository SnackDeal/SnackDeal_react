import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock3, RefreshCw } from 'lucide-react';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';
import { apiGetAdminQnas, type QnaSummary } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { QNA_TYPE_LABEL } from '@/lib/format';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AdminQnaListPage() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();
  const [qnas, setQnas] = useState<QnaSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ANSWERED'>('ALL');
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);

  const orderedQnas = useMemo(
    () => [...qnas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [qnas]
  );

  const visibleQnas = useMemo(() => {
    if (statusFilter === 'ALL') return orderedQnas;
    if (statusFilter === 'PENDING') return orderedQnas.filter((qna) => !qna.answered);
    return orderedQnas.filter((qna) => qna.answered);
  }, [orderedQnas, statusFilter]);

  const totalPages = Math.max(Math.ceil(visibleQnas.length / pageSize), 1);
  const clampedPage = Math.min(page, totalPages - 1);
  const pageItems = visibleQnas.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  useEffect(() => {
    if (!accessToken || !adminSession) return;

    let alive = true;
    setListLoading(true);
    setError('');

    apiGetAdminQnas(accessToken)
      .then((items) => {
        if (!alive) return;
        setQnas(items);
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
    setPage(0);
  }, [statusFilter, pageSize]);

  const refresh = async () => {
    if (!accessToken) return;
    setListLoading(true);
    setError('');
    try {
      const items = await apiGetAdminQnas(accessToken);
      setQnas(items);
    } catch (e) {
      const message = e instanceof Error ? e.message : '문의 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setListLoading(false);
    }
  };

  if (!adminSession) return null;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0 }}>문의 관리</h1>
          <p style={{ marginTop: 6, fontSize: 14, color: '#666', lineHeight: 1.6 }}>
            문의 목록만 보여주고, 항목을 누르면 상세 페이지로 이동합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
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

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={() => setStatusFilter('ALL')} style={filterStyle(statusFilter === 'ALL')}>
          전체 문의
        </button>
        <button type="button" onClick={() => setStatusFilter('PENDING')} style={filterStyle(statusFilter === 'PENDING')}>
          답변 대기
        </button>
        <button type="button" onClick={() => setStatusFilter('ANSWERED')} style={filterStyle(statusFilter === 'ANSWERED')}>
          답변 완료
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
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      <section style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #eef2f7' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>문의 목록</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>항목을 누르면 상세 페이지로 이동합니다.</div>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{visibleQnas.length}건</div>
        </div>

        <div style={{ maxHeight: 720, overflowY: 'auto' }}>
          {listLoading ? (
            <div style={{ padding: 24, color: '#64748b' }}>문의 목록을 불러오는 중...</div>
          ) : pageItems.length === 0 ? (
            <div style={{ padding: 24, color: '#64748b' }}>등록된 문의가 없습니다.</div>
          ) : (
            pageItems.map((qna) => (
              <button
                key={qna.id}
                type="button"
                onClick={() => navigate(`/admin/cs/qna/${qna.id}`)}
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
                  <div style={statusBadgeStyle(qna.answered)}>
                    {qna.answered ? '답변완료' : '대기중'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                      [{QNA_TYPE_LABEL[qna.type]}] {qna.title}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                      <Clock3 size={13} />
                      {formatLocalDateTime(qna.createdAt)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <AdminPagination
        page={clampedPage}
        totalPages={totalPages}
        total={visibleQnas.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        unitLabel="건"
      />
    </div>
  );
}

function filterStyle(active: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: 6,
    minWidth: 160,
    background: active ? '#f9fafb' : 'white',
    fontWeight: 600,
    cursor: 'pointer',
  };
}

function statusBadgeStyle(answered: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    background: answered ? '#dcfce7' : '#fff7ed',
    color: answered ? '#166534' : '#c2410c',
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 700,
    height: 'fit-content',
  };
}
