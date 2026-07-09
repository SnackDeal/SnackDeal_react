export default function AdminNoticesPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#fff',
          padding: '24px',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>공지사항 관리</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          공지사항 관리 화면 자리입니다. 이후 목록, 등록, 수정 기능을 같은 관리자 메뉴 구조 안에 바로 붙일 수 있게 라우트만 먼저 연결해 두었습니다.
        </p>
      </div>
    </div>
  );
}
