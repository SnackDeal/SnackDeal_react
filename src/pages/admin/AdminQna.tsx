import { useState } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useCSStore } from '@/stores/csStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

export default function AdminQnaPage() {
  const { adminSession } = useAdminAuthStore();
  const { getQNAs } = useCSStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!adminSession) return null;

  const qnas = getQNAs();
  const selected = qnas.find((q) => q.id === selectedId);

  const handleSubmitAnswer = () => {
    if (!answer.trim()) {
      setToast({ message: '답변을 입력해주세요.', type: 'error' });
      return;
    }
    setToast({ message: '답변이 등록되었습니다.', type: 'success' });
    setAnswer('');
    setSelectedId(null);
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>문의 관리</h1>

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

            <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                {selected.title}
              </h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', fontSize: '12px', color: '#666' }}>
                <span>회원ID: {selected.member_id}</span>
                <span>분류: {selected.type}</span>
                <span>상태: {selected.is_answered ? '답변완료' : '대기중'}</span>
              </div>

              <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '4px', marginBottom: '24px', lineHeight: '1.6', color: '#333' }}>
                {selected.content}
              </div>

              {selected.answer && (
                <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '4px', marginBottom: '24px', borderLeft: '3px solid #2e7d32' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '12px' }}>관리자 답변</div>
                  <div style={{ fontSize: '13px', color: '#333' }}>{selected.answer.content}</div>
                </div>
              )}

              {!selected.is_answered && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px' }}>답변 작성</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '13px',
                      minHeight: '120px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <Button onClick={handleSubmitAnswer}>답변 등록</Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>제목</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '100px' }}>분류</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '100px' }}>상태</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '100px' }}>접수일</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '50px' }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {qnas.map((qna) => (
                  <tr key={qna.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{qna.title}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                      {qna.type}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: qna.is_answered ? '#e8f5e9' : '#fff3e0',
                          color: qna.is_answered ? '#2e7d32' : '#e65100',
                          borderRadius: '2px',
                          fontSize: '11px',
                        }}
                      >
                        {qna.is_answered ? '완료' : '대기'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {new Date(qna.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedId(qna.id)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        보기
                      </button>
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
