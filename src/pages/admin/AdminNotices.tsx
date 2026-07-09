import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  apiGetPublicNotice,
  apiGetPublicNotices,
  type NoticeDetail,
  type NoticeSummary,
} from '@/lib/api';

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [detailsById, setDetailsById] = useState<Record<number, NoticeDetail>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const selectedNotice = useMemo(
    () => (selectedId ? detailsById[selectedId] : undefined),
    [detailsById, selectedId]
  );

  useEffect(() => {
    let alive = true;

    setListLoading(true);
    setError('');

    apiGetPublicNotices()
      .then((items) => {
        if (!alive) return;
        setNotices(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
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

  useEffect(() => {
    if (!selectedId || detailsById[selectedId]) return;

    let alive = true;
    setDetailLoading(true);

    apiGetPublicNotice(selectedId)
      .then((item) => {
        if (!alive) return;
        setDetailsById((current) => ({ ...current, [item.id]: item }));
      })
      .catch((e: { message?: string }) => {
        if (!alive) return;
        setError(e.message ?? '공지 상세를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [detailsById, selectedId]);

  const orderedNotices = useMemo(
    () =>
      [...notices]
        .filter((notice) => (showPinnedOnly ? notice.pinned : true))
        .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [notices, showPinnedOnly]
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0 }}>공지사항 관리</h1>
          <p style={{ marginTop: 6, fontSize: 14, color: '#666', lineHeight: 1.6 }}>
            공지 목록과 상세를 조회하는 관리자 화면입니다. 등록/수정/삭제는 백엔드 관리자 API가 연결되면 같은 패턴으로 붙일 수 있습니다.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>새로고침</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowPinnedOnly(false)}
          style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            minWidth: 160,
            background: showPinnedOnly ? 'white' : '#f9fafb',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          전체 공지
        </button>
        <button
          type="button"
          onClick={() => setShowPinnedOnly(true)}
          style={{
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            minWidth: 160,
            background: showPinnedOnly ? '#f9fafb' : 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          고정 공지
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
          <button
            type="button"
            onClick={() => window.location.reload()}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)', gap: 20 }}>
        <section
          style={{
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            background: '#fff',
            overflow: 'hidden',
          }}
        >
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
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                최신순, 고정 공지 우선 정렬
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{orderedNotices.length}건</div>
          </div>

          <div style={{ maxHeight: 640, overflowY: 'auto' }}>
            {listLoading ? (
              <div style={{ padding: 24, color: '#64748b' }}>공지 목록을 불러오는 중...</div>
            ) : orderedNotices.length === 0 ? (
              <div style={{ padding: 24, color: '#64748b' }}>등록된 공지가 없습니다.</div>
            ) : (
              orderedNotices.map((notice) => {
                const active = notice.id === selectedId;
                return (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => setSelectedId(notice.id)}
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
                          flex: '0 0 auto',
                          borderRadius: 999,
                          background: notice.pinned ? '#1d4ed8' : '#e2e8f0',
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
                        <div style={{ fontSize: 15, fontWeight: active ? 800 : 700, color: '#0f172a', lineHeight: 1.5 }}>
                          {notice.title}
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
                          {formatLocalDateTime(notice.createdAt)}
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
          {selectedNotice ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <span
                  style={{
                    borderRadius: 999,
                    background: selectedNotice.pinned ? '#1d4ed8' : '#e2e8f0',
                    color: selectedNotice.pinned ? '#fff' : '#475569',
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {selectedNotice.pinned ? '고정 공지' : '일반 공지'}
                </span>
                <span style={{ color: '#64748b', fontSize: 13 }}>{formatLocalDateTime(selectedNotice.createdAt)}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                {selectedNotice.title}
              </h2>
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
                {selectedNotice.content}
              </div>

              <div
                style={{
                  marginTop: 24,
                  borderRadius: 16,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  padding: 16,
                  color: '#475569',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 8 }}>
                  <ShieldAlert size={16} />
                  관리자 메모
                </div>
                이 화면은 공지 조회용으로 먼저 연결했습니다. 현재 백엔드에는 관리자 공지 CRUD 컨트롤러가 없어서,
                등록/수정/삭제 버튼은 아직 붙이지 않았습니다.
              </div>
            </>
          ) : detailLoading ? (
            <div style={{ color: '#64748b' }}>공지 상세를 불러오는 중...</div>
          ) : (
            <div style={{ color: '#64748b' }}>왼쪽 목록에서 공지를 선택하세요.</div>
          )}
        </section>
      </div>
    </div>
  );
}
