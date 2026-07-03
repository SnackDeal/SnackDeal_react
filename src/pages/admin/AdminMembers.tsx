import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useAuthStore } from '@/stores/authStore';

export default function AdminMembersPage() {
  const { adminSession } = useAdminAuthStore();
  const { sessions } = useAuthStore();

  if (!adminSession) return null;

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>회원 관리</h1>

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            회원이 없습니다.
          </div>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>이메일</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>이름</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>휴대폰</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>가입일</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{session.email}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{session.name}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{session.phone}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: session.status === 'ACTIVE' ? '#e8f5e9' : '#ffebee',
                          color: session.status === 'ACTIVE' ? '#2e7d32' : '#c62828',
                          borderRadius: '2px',
                          fontSize: '11px',
                        }}
                      >
                        {session.status === 'ACTIVE' ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
