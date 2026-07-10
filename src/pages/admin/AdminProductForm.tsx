import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  apiCreateAdminProduct,
  apiDeleteFile,
  apiGetAdminCategories,
  apiGetAdminProduct,
  apiUploadFile,
  apiUpdateAdminProduct,
  type AdminCategory,
  type AdminProductPayload,
  type ProductStatus,
} from '@/lib/api';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { prepareImageForUpload } from '@/lib/imageFile';

type Mode = 'create' | 'edit';

const statusOptions: Array<{ value: ProductStatus; label: string }> = [
  { value: 'ACTIVE', label: '판매중' },
  { value: 'INACTIVE', label: '판매중지' },
  { value: 'DELETED', label: '삭제' },
];

const emptyForm = {
  name: '',
  price: '',
  categoryId: '',
  description: '',
  stock: '',
  imageUrl: '',
  status: 'ACTIVE' as ProductStatus,
};

export function AdminProductForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAdminAuthStore();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiGetAdminCategories(accessToken)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [accessToken]);

  useEffect(() => {
    if (mode !== 'edit' || !accessToken || !id) return;

    setIsLoading(true);
    apiGetAdminProduct(accessToken, Number(id))
      .then((product) => {
        setForm({
          name: product.name,
          price: String(product.price),
          categoryId: String(product.categoryId),
          description: product.description ?? '',
          stock: String(product.stock),
          imageUrl: product.imageUrl,
          status: product.status,
        });
      })
      .catch(() => {
        setToast({ message: '상품 정보를 불러올 수 없습니다.', type: 'error' });
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, id, mode]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = (): AdminProductPayload | null => {
    const name = form.name.trim();
    const imageUrl = form.imageUrl.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const categoryId = Number(form.categoryId);

    if (!name) {
      setToast({ message: '상품명을 입력해주세요.', type: 'error' });
      return null;
    }
    if (!Number.isFinite(price) || price < 0) {
      setToast({ message: '가격은 0 이상으로 입력해주세요.', type: 'error' });
      return null;
    }
    if (!categoryId) {
      setToast({ message: '카테고리를 선택해주세요.', type: 'error' });
      return null;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setToast({ message: '재고는 0 이상으로 입력해주세요.', type: 'error' });
      return null;
    }
    if (!imageUrl) {
      setToast({ message: '대표 이미지 URL을 입력해주세요.', type: 'error' });
      return null;
    }

    return {
      name,
      price,
      categoryId,
      description: form.description.trim(),
      stock,
      imageUrl,
      status: form.status,
    };
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file || !accessToken) return;
    const previousUrl = form.imageUrl.trim();

    setIsUploading(true);
    try {
      const uploadFile = await prepareImageForUpload(file);
      if (previousUrl) {
        await apiDeleteFile(accessToken, previousUrl).catch(() => null);
      }
      const uploaded = await apiUploadFile(accessToken, uploadFile, 'product');
      updateField('imageUrl', uploaded.url);
      setToast({ message: '이미지가 업로드되었습니다.', type: 'success' });
    } catch (error) {
      setToast({
        message: (error as { message?: string }).message ?? '이미지 업로드에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setToast({ message: '관리자 로그인이 필요합니다.', type: 'error' });
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await apiCreateAdminProduct(accessToken, payload);
        setToast({ message: '상품이 등록되었습니다.', type: 'success' });
      } else {
        await apiUpdateAdminProduct(accessToken, Number(id), payload);
        setToast({ message: '상품이 수정되었습니다.', type: 'success' });
      }
      setTimeout(() => navigate('/admin/products'), 500);
    } catch (error) {
      setToast({
        message: (error as { message?: string }).message ?? '상품 저장에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!accessToken) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>관리자 로그인이 필요합니다.</div>;
  }

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>로딩중...</div>;
  }

  const title = mode === 'create' ? '상품 등록' : '상품 수정';

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{title}</h1>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
            목록으로
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="상품명" required>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} style={inputStyle} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="가격" required>
                <input type="number" min="0" value={form.price} onChange={(e) => updateField('price', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="재고" required>
                <input type="number" min="0" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="카테고리" required>
                <select value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)} style={inputStyle}>
                  <option value="">선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="상태" required>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value as ProductStatus)} style={inputStyle}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="대표 이미지" required>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    void handleImageUpload(e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                  style={inputStyle}
                />
                <input
                  value={form.imageUrl}
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                  placeholder="업로드된 이미지 URL"
                  style={inputStyle}
                />
                {isUploading && <span style={{ fontSize: 12, color: '#64748b' }}>업로드 중...</span>}
              </div>
            </Field>

            <Field label="상품 설명">
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={8}
                style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장중...' : '저장'}
              </Button>
            </div>
          </div>

          <aside style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', height: 'fit-content' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>이미지 미리보기</div>
            <div style={{ aspectRatio: '1 / 1', borderRadius: '6px', background: '#f5f5f5', overflow: 'hidden' }}>
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px' }}>
                  이미지를 업로드하세요
                </div>
              )}
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
      <span>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '40px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '14px',
  boxSizing: 'border-box',
};
