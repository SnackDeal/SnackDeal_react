import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCSStore } from '@/stores/csStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

const QNA_TYPES = [
  { value: 'ORDER', label: '주문' },
  { value: 'SHIPPING', label: '배송' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'OTHER', label: '기타' },
];

export default function QnaListPage() {
  const { member } = useAuthStore();
  const { getFAQs, getQNAs, addQNA } = useCSStore();
  const [tab, setTab] = useState<'faq' | 'qna'>('faq');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ type: 'OTHER', title: '', content: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const faqs = getFAQs();
  const myQNAs = member ? getQNAs(Number(member.id)) : [];

  const handleSubmitQNA = () => {
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: '제목과 내용을 입력해주세요.', type: 'error' });
      return;
    }
    addQNA({
      type: form.type as any,
      title: form.title,
      content: form.content,
      is_answered: false,
      member_id: Number(member?.id) || 0,
    });
    setToast({ message: '문의가 등록되었습니다.', type: 'success' });
    setForm({ type: 'OTHER', title: '', content: '' });
    setIsFormOpen(false);
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

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>고객센터</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #eee' }}>
          <button
            onClick={() => setTab('faq')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === 'faq' ? 'bold' : 'normal',
              borderBottom: tab === 'faq' ? '2px solid #333' : 'none',
              color: tab === 'faq' ? '#333' : '#666',
            }}
          >
            FAQ
          </button>
          <button
            onClick={() => setTab('qna')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === 'qna' ? 'bold' : 'normal',
              borderBottom: tab === 'qna' ? '2px solid #333' : 'none',
              color: tab === 'qna' ? '#333' : '#666',
            }}
          >
            내 문의
          </button>
        </div>

        {/* FAQ Tab */}
        {tab === 'faq' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {faqs.map((faq) => (
              <details
                key={faq.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  padding: '16px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }}>
                  [{QNA_TYPES.find((t) => t.value === faq.type)?.label}] {faq.title}
                </summary>
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #eee',
                    color: '#666',
                    lineHeight: '1.6',
                  }}
                >
                  {faq.content}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* QNA Tab */}
        {tab === 'qna' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Button onClick={() => setIsFormOpen(!isFormOpen)}>
                {isFormOpen ? '취소' : '문의하기'}
              </Button>
            </div>

            {isFormOpen && (
              <div
                style={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'grid',
                  gap: '16px',
                }}
              >
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    분류
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    {QNA_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    제목
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    내용
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minHeight: '120px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <Button onClick={handleSubmitQNA}>등록</Button>
              </div>
            )}

            {myQNAs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                문의 내역이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {myQNAs.map((qna) => (
                  <div key={qna.id} style={{ border: '1px solid #eee', borderRadius: '4px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600' }}>
                        [{QNA_TYPES.find((t) => t.value === qna.type)?.label}] {qna.title}
                      </div>
                      <div style={{ fontSize: '12px', color: qna.is_answered ? '#27ae60' : '#999' }}>
                        {qna.is_answered ? '답변완료' : '대기중'}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                      {new Date(qna.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '13px', color: '#333', marginBottom: '12px' }}>
                      {qna.content}
                    </div>
                    {qna.answer && (
                      <div
                        style={{
                          padding: '12px',
                          background: '#f9f9f9',
                          borderRadius: '4px',
                          borderLeft: '3px solid #333',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                          관리자 답변
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>{qna.answer.content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
