import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiCreateAdminCategory,
  apiDeleteAdminCategory,
  apiGetAdminCategories,
  apiUpdateAdminCategory,
  apiUpdateAdminCategoryOrder,
  type AdminCategory,
  type ApiError,
} from '@/lib/api';

type CategoryForm = {
  name: string;
};

const emptyForm: CategoryForm = {
  name: '',
};

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isNotImplementedError(error: ApiError) {
  return error.message?.includes('구현되지') || error.code === 'NOT_IMPLEMENTED';
}

export function AdminCategories() {
  const { adminSession, accessToken } = useAdminAuthStore();
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orderDraft, setOrderDraft] = useState<Record<number, number>>({});
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          (orderDraft[a.id] ?? a.sortOrder ?? 0) - (orderDraft[b.id] ?? b.sortOrder ?? 0) ||
          a.id - b.id
      ),
    [categories, orderDraft]
  );

  const selectedCategory = editingId ? categories.find((category) => category.id === editingId) : null;

  const loadCategories = async () => {
    if (!accessToken) {
      setError('관리자 로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiGetAdminCategories(accessToken);
      setCategories(result);
      setOrderDraft(
        Object.fromEntries(result.map((category) => [category.id, category.sortOrder ?? 0]))
      );
    } catch (e) {
      const apiError = e as ApiError;
      setError(apiError.message ?? '카테고리 목록을 불러올 수 없습니다.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminSession) return;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSession, accessToken]);

  if (!adminSession) return null;

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setForm({ name: category.name });
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      setToast({ message: '관리자 로그인이 필요합니다.', type: 'error' });
      return;
    }

    const name = form.name.trim();
    if (!name) {
      setToast({ message: '카테고리명을 입력해주세요.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiUpdateAdminCategory(accessToken, editingId, {
          name,
          sortOrder: orderDraft[editingId] ?? selectedCategory?.sortOrder ?? 0,
        });
        await loadCategories();
        setToast({ message: '카테고리가 수정되었습니다.', type: 'success' });
      } else {
        await apiCreateAdminCategory(accessToken, {
          name,
          sortOrder: sortedCategories.length,
        });
        await loadCategories();
        setToast({ message: '카테고리가 추가되었습니다.', type: 'success' });
      }
      resetForm();
    } catch (e) {
      const apiError = e as ApiError;
      if (isNotImplementedError(apiError)) {
        if (editingId) {
          setCategories((prev) =>
            prev.map((category) =>
              category.id === editingId
                ? { ...category, name, sortOrder: orderDraft[editingId] ?? category.sortOrder, updatedAt: new Date().toISOString() }
                : category
            )
          );
          setToast({ message: '카테고리가 수정되었습니다. (발표용 로컬 반영)', type: 'success' });
        } else {
          const nextId = Math.max(0, ...categories.map((category) => category.id)) + 1;
          const sortOrder = sortedCategories.length;
          setCategories((prev) => [
            ...prev,
            {
              id: nextId,
              name,
              sortOrder,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
          setOrderDraft((prev) => ({ ...prev, [nextId]: sortOrder }));
          setToast({ message: '카테고리가 추가되었습니다. (발표용 로컬 반영)', type: 'success' });
        }
        resetForm();
      } else {
        setToast({ message: apiError.message ?? '카테고리 저장에 실패했습니다.', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOrderChange = (categoryId: number, sortOrder: number) => {
    setOrderDraft((prev) => ({ ...prev, [categoryId]: sortOrder }));
  };

  const handleSaveOrder = async () => {
    if (!accessToken) {
      setToast({ message: '관리자 로그인이 필요합니다.', type: 'error' });
      return;
    }

    setSavingOrder(true);
    try {
      await apiUpdateAdminCategoryOrder(accessToken, {
        categoryOrders: sortedCategories.map((category, index) => ({
          categoryId: category.id,
          sortOrder: index,
        })),
      });
      await loadCategories();
      setToast({ message: '카테고리 정렬 순서가 저장되었습니다.', type: 'success' });
    } catch (e) {
      const apiError = e as ApiError;
      if (isNotImplementedError(apiError)) {
        setCategories((prev) =>
          prev.map((category) => {
            const index = sortedCategories.findIndex((item) => item.id === category.id);
            return index >= 0
              ? { ...category, sortOrder: index, updatedAt: new Date().toISOString() }
              : category;
          })
        );
        setOrderDraft(
          Object.fromEntries(sortedCategories.map((category, index) => [category.id, index]))
        );
        setToast({ message: '카테고리 정렬 순서가 저장되었습니다. (발표용 로컬 반영)', type: 'success' });
      } else {
        setToast({ message: apiError.message ?? '카테고리 정렬 저장에 실패했습니다.', type: 'error' });
      }
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (!accessToken) {
      setToast({ message: '관리자 로그인이 필요합니다.', type: 'error' });
      return;
    }

    if (!window.confirm(`'${category.name}' 카테고리를 삭제할까요?`)) return;

    try {
      await apiDeleteAdminCategory(accessToken, category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      setOrderDraft((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      if (editingId === category.id) resetForm();
      setToast({ message: '카테고리가 삭제되었습니다.', type: 'success' });
    } catch (e) {
      const apiError = e as ApiError;
      if (isNotImplementedError(apiError)) {
        setCategories((prev) => prev.filter((item) => item.id !== category.id));
        setOrderDraft((prev) => {
          const next = { ...prev };
          delete next[category.id];
          return next;
        });
        if (editingId === category.id) resetForm();
        setToast({ message: '카테고리가 삭제되었습니다. (발표용 로컬 반영)', type: 'success' });
      } else {
        setToast({ message: apiError.message ?? '카테고리 삭제에 실패했습니다.', type: 'error' });
      }
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>카테고리 관리</h1>
            <p style={{ fontSize: '13px', color: '#666' }}>상품 노출 카테고리와 정렬 순서를 관리합니다.</p>
          </div>
          <Button variant="outline" onClick={loadCategories} disabled={loading}>
            새로고침
          </Button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div>
            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:hidden">
              {loading ? (
                <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                  로딩 중...
                </div>
              ) : sortedCategories.length === 0 && !error ? (
                <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                  등록된 카테고리가 없습니다.
                </div>
              ) : (
                sortedCategories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'rounded border border-gray-200 bg-white p-4',
                      editingId === category.id && 'border-brand-200 bg-brand-50'
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{category.name}</div>
                        <div className="mt-1 text-xs text-gray-500">ID {category.id}</div>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        정렬
                        <input
                          type="number"
                          value={orderDraft[category.id] ?? category.sortOrder ?? 0}
                          onChange={(e) => handleOrderChange(category.id, Number(e.target.value))}
                          className="h-8 w-16 rounded border border-gray-300 px-2 text-right text-xs"
                        />
                      </label>
                    </div>
                    <div className="mb-4 text-xs text-gray-500">
                      수정일 {formatDate(category.updatedAt)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="h-10 rounded border border-gray-300 bg-white text-sm font-semibold text-gray-800"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="h-10 rounded border border-red-200 bg-red-50 text-sm font-semibold text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden sm:block" style={{ border: '1px solid #eee', borderRadius: '4px', overflowX: 'auto', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px', borderBottom: '1px solid #eee', background: '#fff' }}>
                <Button type="button" variant="outline" size="sm" onClick={handleSaveOrder} disabled={loading || savingOrder || sortedCategories.length === 0}>
                  {savingOrder ? '정렬 저장 중...' : '정렬 저장'}
                </Button>
              </div>
              <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>카테고리명</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', width: '70px' }}>정렬</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '176px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        로딩 중...
                      </td>
                    </tr>
                  ) : sortedCategories.length === 0 && !error ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        등록된 카테고리가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sortedCategories.map((category) => (
                      <tr
                        key={category.id}
                        style={{
                          borderBottom: '1px solid #eee',
                          background: editingId === category.id ? '#fff8f1' : 'white',
                        }}
                      >
                        <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{category.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{category.name}</div>
                          <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                            수정일 {formatDate(category.updatedAt)}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>
                          <input
                            type="number"
                            value={orderDraft[category.id] ?? category.sortOrder ?? 0}
                            onChange={(e) => handleOrderChange(category.id, Number(e.target.value))}
                            style={{ width: '64px', padding: '7px 8px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'right', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(category)}
                              style={{ minWidth: '64px', padding: '7px 12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              style={{ minWidth: '64px', padding: '7px 12px', border: '1px solid #ffcdd2', borderRadius: '4px', background: '#fff5f5', color: '#c62828', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 sm:hidden">
              <Button type="button" variant="outline" onClick={handleSaveOrder} disabled={loading || savingOrder || sortedCategories.length === 0} className="w-full">
                {savingOrder ? '정렬 저장 중...' : '정렬 저장'}
              </Button>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} style={{ border: '1px solid #eee', borderRadius: '4px', padding: '20px', background: 'white', display: 'grid', gap: '16px', scrollMarginTop: '80px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>
                {editingId ? '카테고리 수정' : '카테고리 추가'}
              </h2>
              <p style={{ fontSize: '12px', color: '#666' }}>
                {selectedCategory ? `선택 ID: ${selectedCategory.id}` : '새 카테고리를 등록합니다.'}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
                카테고리명
              </label>
              <input
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 스낵"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  취소
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? '저장 중...' : editingId ? '수정 저장' : '추가'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
