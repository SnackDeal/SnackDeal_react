import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiGetAdminCategories,
  apiGetAdminProducts,
  apiUpdateAdminProductStatus,
  type AdminCategory,
  type AdminProductListItem,
  type ProductStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';

const PRODUCT_UPDATED_EVENT = 'snackdeal-products-updated';

function notifyProductsUpdated() {
  const value = String(Date.now());
  localStorage.setItem(PRODUCT_UPDATED_EVENT, value);
  window.dispatchEvent(new Event(PRODUCT_UPDATED_EVENT));
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<{ [key: string]: boolean }>({
    ACTIVE: true,
    INACTIVE: true,
  });
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sort, setSort] = useState<'latest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('latest');

  useEffect(() => {
    if (!accessToken) return;
    apiGetAdminCategories(accessToken)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [accessToken]);

  const loadProducts = useCallback(async (silent = false) => {
    if (!adminSession || !accessToken) return;

    const selectedStatuses = Object.entries(filterStatus)
      .filter(([, checked]) => checked)
      .map(([status]) => status as ProductStatus);

    if (selectedStatuses.length === 0) {
      setProducts([]);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await apiGetAdminProducts(accessToken, {
        keyword: searchKeyword,
        categoryId: filterCategory ?? undefined,
        status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
        lowStock: filterLowStock,
        sort: sort === 'stock_asc' || sort === 'stock_desc' ? 'latest' : sort,
        page: 1,
        size: 100,
      });
      const visibleRows = result.items
        .filter((item) => item.status !== 'DELETED')
        .filter((item) => selectedStatuses.includes(item.status));
      setProducts(visibleRows);
    } catch (e) {
      setError((e as { message?: string }).message ?? '상품 목록을 불러올 수 없습니다.');
      setProducts([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [accessToken, adminSession, filterCategory, filterLowStock, filterStatus, searchKeyword, sort]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (!adminSession) return null;

  let results = [...products];

  if (sort === 'stock_asc') {
    results = results.sort((a, b) => a.stock - b.stock);
  } else if (sort === 'stock_desc') {
    results = results.sort((a, b) => b.stock - a.stock);
  }

  const handleStatusChange = async (id: number, status: ProductStatus) => {
    if (!accessToken) return;
    const previous = products;
    setProducts((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
    setUpdatingProductId(id);
    setError(null);
    try {
      await apiUpdateAdminProductStatus(accessToken, id, status);
      await loadProducts(true);
      notifyProductsUpdated();
    } catch (e) {
      setProducts(previous);
      setError((e as { message?: string }).message ?? '상품 상태 변경에 실패했습니다.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>상품 관리</h1>
            <p style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>등록된 상품과 재고를 관리합니다.</p>
          </div>
          <Button onClick={() => navigate('/admin/products/new')}>+ 상품 등록</Button>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
              검색
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchKeyword(searchInput.trim());
              }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                placeholder="상품명 (Enter로 검색)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                검색
              </button>
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchKeyword('');
                  }}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  초기화
                </button>
              )}
            </form>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
              카테고리
            </label>
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
              판매 상태
            </label>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              {['ACTIVE', 'INACTIVE'].map((status) => (
                <label key={status} style={{ display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterStatus[status]}
                    onChange={(e) => setFilterStatus({ ...filterStatus, [status]: e.target.checked })}
                  />
                  {status === 'ACTIVE' ? '판매중' : '판매중지'}
                </label>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
              />
              재고 부족 (10개 이하)
            </label>
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
              정렬
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="latest">최신순</option>
              <option value="stock_asc">재고 낮은순</option>
              <option value="stock_desc">재고 높은순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {error && (
          <div style={{ marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>{error}</div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            로딩중...
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            결과가 없습니다.
          </div>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', color: '#475569' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>이미지</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>상품명</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>
                    카테고리
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', width: '80px' }}>
                    가격
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', width: '70px' }}>
                    재고
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '100px' }}>
                    상태
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>
                    등록일
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '50px' }}>
                    편집
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((product) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 14 }}>
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc' }}
                      />
                    </td>
                    <td style={{ padding: 14, fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{product.name}</td>
                    <td style={{ padding: 14, fontSize: 12, color: '#64748b' }}>{product.category}</td>
                    <td style={{ padding: 14, textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      ₩{product.price.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: 14,
                        textAlign: 'right',
                        fontSize: 13,
                        color: product.stock < 10 ? '#dc2626' : '#334155',
                        fontWeight: product.stock < 10 ? 700 : 500,
                      }}
                    >
                      {product.stock}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <select
                        value={product.status}
                        disabled={updatingProductId === product.id}
                        onChange={(e) =>
                          handleStatusChange(product.id, e.target.value as ProductStatus)
                        }
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background:
                            product.status === 'ACTIVE'
                              ? '#ecfdf5'
                              : product.status === 'INACTIVE'
                                ? '#fef3c7'
                                : '#fee2e2',
                          color:
                            product.status === 'ACTIVE'
                              ? '#047857'
                              : product.status === 'INACTIVE'
                                ? '#92400e'
                                : '#991b1b',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="ACTIVE">판매중</option>
                        <option value="INACTIVE">판매중지</option>
                        <option value="DELETED">삭제</option>
                      </select>
                    </td>
                    <td style={{ padding: 14, fontSize: 12, color: '#94a3b8' }}>
                      -
                    </td>
                    <td style={{ padding: 14, textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        style={{
                          padding: '6px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#334155',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        편집
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
