import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { apiGetAdminMembers, type MemberDescription } from '@/lib/api';
import { AdminPagination, type AdminPageSize } from '@/components/admin/Pagination';

const STATUS_LABELS: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성', DELETED: '탈퇴' };
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#e8f5e9', color: '#2e7d32' },
  INACTIVE: { bg: '#fff3e0', color: '#e65100' },
  DELETED: { bg: '#ffebee', color: '#c62828' },
};

export default function AdminMembersPage() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();

  const [rows, setRows] = useState<MemberDescription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminSession || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetAdminMembers(accessToken, { keyword, status, page, size: pageSize });
      setRows(res.content);
      setTotal(res.totalElements);
    } catch (e: any) {
      setError(e?.message ?? '회원 목록을 불러올 수 없습니다.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [adminSession, accessToken, keyword, status, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  if (!adminSession) return null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>회원 관리</h1>
      </div>

      {/* 검색/필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          placeholder="이메일 또는 이름 검색"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
          <option value="DELETED">탈퇴</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>
      ) : rows.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>회원이 없습니다.</div>
      ) : (
        <>
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  {['이메일', '이름', '휴대폰', '가입일', '상태', ''].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: h === '상태' ? 'center' : 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const sc = STATUS_COLORS[m.status] ?? { bg: '#f0f0f0', color: '#333' };
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{m.email}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{m.name}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{m.phone}</td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 8px', background: sc.bg, color: sc.color, borderRadius: '2px', fontSize: '11px' }}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/admin/members/${m.id}`)}
                          style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '11px' }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
            unitLabel="명"
          />
        </>
      )}
    </div>
  );
}
