import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock3, RefreshCw } from 'lucide-react';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';
import { CustomerSupportHero } from '@/components/common/CustomerSupportHero';
import { apiGetPublicNotices, type NoticeSummary } from '@/lib/api';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function NoticeListPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);

  useEffect(() => {
    let alive = true;
    setListLoading(true);
    setError('');

    apiGetPublicNotices()
      .then((items) => {
        if (!alive) return;
        setNotices(items);
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '공지 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setListLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const orderedNotices = useMemo(
    () =>
      [...notices].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [notices]
  );
  const totalPages = Math.max(Math.ceil(orderedNotices.length / pageSize), 1);
  const clampedPage = Math.min(page, totalPages - 1);
  const pageItems = orderedNotices.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const refresh = async () => {
    setListLoading(true);
    setError('');
    try {
      const items = await apiGetPublicNotices();
      setNotices(items);
    } catch (e) {
      const message = e instanceof Error ? e.message : '공지 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 48px' }}>
      <CustomerSupportHero
        section="notice"
        description="공지 목록에서 항목을 선택하면 상세 페이지로 이동합니다."
        title="공지사항"
      />

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
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              borderRadius: 10,
              background: '#be123c',
              color: '#fff',
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={14} />
            다시 시도
          </button>
        </div>
      )}

      <section style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid #eef2f7',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>공지 목록</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>최신 공지가 위에 표시됩니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{orderedNotices.length}건</div>
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
        </div>

        <div style={{ maxHeight: 720, overflowY: 'auto' }}>
          {listLoading ? (
            <div style={{ padding: 24, color: '#64748b' }}>공지 목록을 불러오는 중...</div>
          ) : orderedNotices.length === 0 ? (
            <div style={{ padding: 24, color: '#64748b' }}>등록된 공지가 없습니다.</div>
          ) : (
            pageItems.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => navigate(`/cs/notice/${notice.id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: 12,
                  border: 'none',
                  borderTop: '1px solid #eef2f7',
                  background: '#fff',
                  padding: '16px 20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    marginTop: 2,
                    flex: '0 0 auto',
                    borderRadius: 999,
                    background: notice.pinned ? '#0f172a' : '#e2e8f0',
                    color: notice.pinned ? '#fff' : '#475569',
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    height: 'fit-content',
                  }}
                >
                  {notice.pinned ? '고정' : '일반'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notice.title}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                    <Clock3 size={13} />
                    {formatLocalDateTime(notice.createdAt)}
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
        total={orderedNotices.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        unitLabel="건"
      />
    </div>
  );
}
