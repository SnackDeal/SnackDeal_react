import { useState } from 'react';
import { useCSStore } from '@/stores/csStore';

export default function NoticeListPage() {
  const { getNotices } = useCSStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const notices = getNotices();
  const selected = notices.find((n) => n.id === selectedId);

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>공지사항</h1>

        {selected ? (
          <div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                marginBottom: '24px',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ← 목록으로
            </button>

            <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                {selected.title}
              </h2>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
                {new Date(selected.created_at).toLocaleDateString()}
              </div>
              <div style={{ lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>
                {selected.content}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {notices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelectedId(notice.id)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    {notice.is_pinned && (
                      <span
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          background: '#333',
                          color: 'white',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                        }}
                      >
                        공지
                      </span>
                    )}
                    <h3 style={{ fontWeight: '600', fontSize: '16px' }}>{notice.title}</h3>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(notice.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
