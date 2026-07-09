import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiCreateAdminFaq,
  apiDeleteAdminFaq,
  apiGetAdminFaq,
  apiGetAdminFaqs,
  apiUpdateAdminFaq,
  type AdminFaq,
  type AdminFaqPayload,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { QNA_TYPE_LABEL } from '@/lib/format';
import type { QnaType } from '@/types';

const FAQ_TYPES: Array<{ value: QnaType; label: string }> = [
  { value: 'ORDER', label: '주문' },
  { value: 'SHIPPING', label: '배송' },
  { value: 'PRODUCT', label: '상품' },
  { value: 'OTHER', label: '기타' },
];

const EMPTY_FORM: AdminFaqPayload = {
  type: 'ORDER',
  title: '',
  content: '',
};

export default function AdminFaqPage() {
  const { adminSession, accessToken } = useAdminAuthStore();

  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [selectedType, setSelectedType] = useState<QnaType | ''>('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<AdminFaq | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminFaqPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadFaqs = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiGetAdminFaqs(accessToken, selectedType || undefined);
      setFaqs(data);
      setSelectedFaq((prev) => (prev ? data.find((item) => item.id === prev.id) ?? prev : prev));
    } catch (e) {
      setFaqs([]);
      setError((e as { message?: string }).message ?? 'FAQ 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminSession) return;
    void loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, accessToken, selectedType]);

  if (!adminSession) return null;

  const openCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = async (id: number) => {
    if (!accessToken) return;
    setDetailLoading(true);
    try {
      const faq = await apiGetAdminFaq(accessToken, id);
      setFormMode('edit');
      setEditingId(id);
      setForm({ type: faq.type, title: faq.title, content: faq.content });
      setFormOpen(true);
    } catch (e) {
      setToast({ message: (e as { message?: string }).message ?? 'FAQ 상세를 불러올 수 없습니다.', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    if (!accessToken) return;
    setDetailLoading(true);
    try {
      const faq = await apiGetAdminFaq(accessToken, id);
      setSelectedFaq(faq);
    } catch (e) {
      setToast({ message: (e as { message?: string }).message ?? 'FAQ 상세를 불러올 수 없습니다.', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: '제목과 내용을 입력해주세요.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        await apiCreateAdminFaq(accessToken, {
          type: form.type,
          title: form.title.trim(),
          content: form.content.trim(),
        });
        setToast({ message: 'FAQ가 등록되었습니다.', type: 'success' });
      } else if (editingId != null) {
        await apiUpdateAdminFaq(accessToken, editingId, {
          type: form.type,
          title: form.title.trim(),
          content: form.content.trim(),
        });
        setToast({ message: 'FAQ가 수정되었습니다.', type: 'success' });
      }
      closeForm();
      await loadFaqs();
    } catch (e) {
      setToast({ message: (e as { message?: string }).message ?? 'FAQ 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    if (!window.confirm('이 FAQ를 삭제하시겠습니까?')) return;
    try {
      await apiDeleteAdminFaq(accessToken, id);
      setToast({ message: 'FAQ가 삭제되었습니다.', type: 'success' });
      if (selectedFaq?.id === id) setSelectedFaq(null);
      await loadFaqs();
    } catch (e) {
      setToast({ message: (e as { message?: string }).message ?? 'FAQ 삭제에 실패했습니다.', type: 'error' });
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111' }}>FAQ 관리</h1>
            <p style={{ marginTop: '6px', fontSize: '14px', color: '#666' }}>
              공개 FAQ를 관리합니다. 등록/수정/삭제는 관리자 권한이 필요합니다.
            </p>
          </div>
          <Button onClick={openCreateForm}>FAQ 등록</Button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType((e.target.value || '') as QnaType | '')}
            style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', minWidth: '160px', background: 'white' }}
          >
            <option value="">전체 타입</option>
            {FAQ_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => void loadFaqs()}>
            새로고침
          </Button>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selectedFaq ? '1.3fr 0.9fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          <section style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: '16px' }}>
              FAQ 목록
            </div>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>불러오는 중...</div>
            ) : faqs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>등록된 FAQ가 없습니다.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>타입</th>
                      <th style={thStyle}>제목</th>
                      <th style={thStyle}>수정일</th>
                      <th style={thStyle}>동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id} style={{ borderTop: '1px solid #eef2f7' }}>
                        <td style={tdStyle}>{faq.id}</td>
                        <td style={tdStyle}>{QNA_TYPE_LABEL[faq.type] ?? faq.type}</td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => void openDetail(faq.id)}
                            style={{ border: 0, background: 'none', padding: 0, color: '#0f172a', fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}
                          >
                            {faq.title}
                          </button>
                        </td>
                        <td style={tdStyle}>{formatDate(faq.updatedAt || faq.createdAt)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => void openDetail(faq.id)} style={ghostButtonStyle}>
                              상세
                            </button>
                            <button type="button" onClick={() => void openEditForm(faq.id)} style={ghostButtonStyle}>
                              수정
                            </button>
                            <button type="button" onClick={() => void handleDelete(faq.id)} style={dangerButtonStyle}>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedFaq && (
            <aside style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', padding: '20px', position: 'sticky', top: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>상세</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>{selectedFaq.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFaq(null)}
                  style={{ border: 0, background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                >
                  닫기
                </button>
              </div>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: '#374151' }}>
                <div><strong>타입:</strong> {QNA_TYPE_LABEL[selectedFaq.type] ?? selectedFaq.type}</div>
                <div><strong>등록일:</strong> {formatDate(selectedFaq.createdAt)}</div>
                <div><strong>수정일:</strong> {formatDate(selectedFaq.updatedAt)}</div>
                <div>
                  <strong>내용</strong>
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {selectedFaq.content}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button onClick={() => void openEditForm(selectedFaq.id)}>수정</Button>
                  <Button variant="secondary" onClick={() => void handleDelete(selectedFaq.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {formOpen && (
        <div style={modalOverlayStyle} onClick={closeForm}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{formMode === 'create' ? 'FAQ 등록' : 'FAQ 수정'}</h2>
              <button type="button" onClick={closeForm} style={closeButtonStyle}>닫기</button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={labelStyle}>
                타입
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as QnaType }))}
                  style={inputStyle}
                >
                  {FAQ_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                제목
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="FAQ 제목"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                내용
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="FAQ 내용"
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '180px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button variant="secondary" onClick={closeForm} type="button">
                  취소
                </Button>
                <Button onClick={() => void handleSave()} disabled={saving} type="button">
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div style={{ position: 'fixed', right: '24px', bottom: '24px', padding: '10px 14px', borderRadius: '999px', background: '#111827', color: 'white', fontSize: '13px' }}>
          불러오는 중...
        </div>
      )}
    </>
  );
}

const thStyle: CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: '#475569',
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  padding: '14px',
  fontSize: '13px',
  color: '#111827',
  verticalAlign: 'top',
};

const ghostButtonStyle: CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: 'white',
  cursor: 'pointer',
  fontSize: '12px',
};

const dangerButtonStyle: CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  background: '#fff5f5',
  color: '#b91c1c',
  cursor: 'pointer',
  fontSize: '12px',
};

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 50,
};

const modalStyle: CSSProperties = {
  width: 'min(720px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 24px 80px rgba(15, 23, 42, 0.25)',
};

const closeButtonStyle: CSSProperties = {
  border: 0,
  background: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '13px',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#334155',
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '14px',
};

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
