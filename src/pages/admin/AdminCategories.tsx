import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { GripVertical } from 'lucide-react';
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

function sortCategories(categories: AdminCategory[]) {
  return [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
}

function applyDisplayOrder(categories: AdminCategory[]) {
  return sortCategories(categories).map((category, index) => ({
    ...category,
    sortOrder: index + 1,
  }));
}

function reorderCategories(categories: AdminCategory[], activeId: number, overId: number) {
  const next = applyDisplayOrder(categories);
  const activeIndex = next.findIndex((category) => category.id === activeId);
  const overIndex = next.findIndex((category) => category.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return next;

  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);

  return next.map((category, index) => ({
    ...category,
    sortOrder: index + 1,
  }));
}

function isCategoryMissingError(error: ApiError) {
  return error.message?.includes('카테고리를 찾을 수 없습니다') || error.code === 'CATEGORY_NOT_FOUND';
}

export function AdminCategories() {
  const { adminSession, accessToken } = useAdminAuthStore();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sortedCategories = useMemo(() => applyDisplayOrder(categories), [categories]);
  const selectedCategory = editingId
    ? sortedCategories.find((category) => category.id === editingId)
    : null;

  const loadCategories = async () => {
    if (!accessToken) {
      setError('관리자 로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiGetAdminCategories(accessToken);
      setCategories(applyDisplayOrder(result));
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
  };

  const handleSubmit = async (e: FormEvent) => {
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

    setSavingCategory(true);
    try {
      if (editingId) {
        await apiUpdateAdminCategory(accessToken, editingId, {
          name,
          sortOrder: selectedCategory?.sortOrder ?? sortedCategories.length,
        });
        setToast({ message: '카테고리가 수정되었습니다.', type: 'success' });
      } else {
        await apiCreateAdminCategory(accessToken, {
          name,
          sortOrder: sortedCategories.length + 1,
        });
        setToast({ message: '카테고리가 등록되었습니다.', type: 'success' });
      }
      resetForm();
      await loadCategories();
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '카테고리 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (!accessToken) {
      setToast({ message: '관리자 로그인이 필요합니다.', type: 'error' });
      return;
    }

    if (!window.confirm(`'${category.name}' 카테고리를 삭제할까요?`)) return;

    setDeletingId(category.id);
    try {
      await apiDeleteAdminCategory(accessToken, category.id);
      setCategories((prev) => applyDisplayOrder(prev.filter((item) => item.id !== category.id)));
      if (editingId === category.id) resetForm();
      setToast({ message: '카테고리가 삭제되었습니다.', type: 'success' });
    } catch (e) {
      const apiError = e as ApiError;
      if (isCategoryMissingError(apiError)) {
        setCategories((prev) => applyDisplayOrder(prev.filter((item) => item.id !== category.id)));
        if (editingId === category.id) resetForm();
        setToast({ message: '카테고리가 삭제되었습니다.', type: 'success' });
        return;
      }
      setToast({ message: apiError.message ?? '카테고리 삭제에 실패했습니다.', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragStart = (categoryId: number, e: DragEvent<HTMLElement>) => {
    setDraggingId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(categoryId));
  };

  const handleDragOver = (categoryId: number, e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(categoryId);
  };

  const handleDrop = (categoryId: number, e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    const activeId = Number(e.dataTransfer.getData('text/plain')) || draggingId;
    if (activeId) {
      setCategories((prev) => reorderCategories(prev, activeId, categoryId));
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
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
          sortOrder: index + 1,
        })),
      });
      await loadCategories();
      setToast({ message: '카테고리 정렬 순서가 저장되었습니다.', type: 'success' });
    } catch (e) {
      const apiError = e as ApiError;
      setToast({ message: apiError.message ?? '카테고리 정렬 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSavingOrder(false);
    }
  };

  const renderDragButton = () => (
    <span
      className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded border border-gray-200 bg-white text-gray-500 active:cursor-grabbing"
      title="드래그해서 순서 변경"
      aria-label="드래그해서 순서 변경"
    >
      <GripVertical size={18} />
    </span>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>카테고리 관리</h1>
            <p style={{ fontSize: '13px', color: '#666' }}>카테고리 목록을 조회하고 드래그로 노출 순서를 변경합니다.</p>
          </div>
          <Button variant="outline" onClick={loadCategories} disabled={loading}>
            새로고침
          </Button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div>
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
                    draggable={!savingOrder}
                    onDragStart={(e) => handleDragStart(category.id, e)}
                    onDragOver={(e) => handleDragOver(category.id, e)}
                    onDrop={(e) => handleDrop(category.id, e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'rounded border border-gray-200 bg-white p-4 transition',
                      draggingId === category.id && 'opacity-50',
                      dragOverId === category.id && draggingId !== category.id && 'border-brand-300 shadow-sm'
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {renderDragButton()}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-gray-900">{category.name}</div>
                          <div className="mt-1 text-xs text-gray-500">순서 #{category.sortOrder}</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-500">#{category.sortOrder}</div>
                    </div>
                    <div className="mb-4 text-xs text-gray-500">수정일 {formatDate(category.updatedAt)}</div>
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
                        disabled={deletingId === category.id}
                        className="h-10 rounded border border-red-200 bg-red-50 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === category.id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden sm:block" style={{ border: '1px solid #eee', borderRadius: '4px', overflowX: 'auto', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', background: '#fff' }}>
                <span className="text-xs text-gray-500">행을 드래그해서 노출 순서를 바꿉니다.</span>
                <Button type="button" variant="outline" size="sm" onClick={handleSaveOrder} disabled={loading || savingOrder || sortedCategories.length === 0}>
                  {savingOrder ? '정렬 저장 중...' : '정렬 저장'}
                </Button>
              </div>
              <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '58px' }}>이동</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '64px' }}>순서</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>카테고리명</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '180px' }}>수정일</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '176px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        로딩 중...
                      </td>
                    </tr>
                  ) : sortedCategories.length === 0 && !error ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        등록된 카테고리가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sortedCategories.map((category) => (
                      <tr
                        key={category.id}
                        draggable={!savingOrder}
                        onDragStart={(e) => handleDragStart(category.id, e)}
                        onDragOver={(e) => handleDragOver(category.id, e)}
                        onDrop={(e) => handleDrop(category.id, e)}
                        onDragEnd={handleDragEnd}
                        style={{
                          borderBottom: '1px solid #eee',
                          background: 'white',
                          opacity: draggingId === category.id ? 0.5 : 1,
                          outline: dragOverId === category.id && draggingId !== category.id ? '2px solid #fb923c' : 'none',
                          cursor: savingOrder ? 'default' : 'grab',
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{renderDragButton()}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>#{category.sortOrder}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600 }}>{category.name}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#777' }}>{formatDate(category.updatedAt)}</td>
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
                              disabled={deletingId === category.id}
                              style={{ minWidth: '64px', padding: '7px 12px', border: '1px solid #ffcdd2', borderRadius: '4px', background: '#fff5f5', color: '#c62828', cursor: deletingId === category.id ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: deletingId === category.id ? 0.6 : 1 }}
                            >
                              {deletingId === category.id ? '삭제 중...' : '삭제'}
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

          <form onSubmit={handleSubmit} style={{ border: '1px solid #eee', borderRadius: '4px', padding: '20px', background: 'white', display: 'grid', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>
                {editingId ? '카테고리 수정' : '카테고리 등록'}
              </h2>
              <p style={{ fontSize: '12px', color: '#666' }}>
                {selectedCategory ? `선택 순서 #${selectedCategory.sortOrder}` : '새 카테고리는 마지막 순서로 추가됩니다.'}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                카테고리명
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 과자"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={savingCategory}>
                  취소
                </Button>
              )}
              <Button type="submit" disabled={savingCategory}>
                {savingCategory ? '저장 중...' : editingId ? '수정 저장' : '등록'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
