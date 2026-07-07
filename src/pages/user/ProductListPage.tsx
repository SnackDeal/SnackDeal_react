import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { apiGetProduct, apiGetProducts } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const PRODUCT_UPDATED_EVENT = 'snackdeal-products-updated';

function isRenderableImageUrl(url: string) {
  return /^https?:\/\//.test(url);
}

type ProductListSort = 'latest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'popular';
const CLIENT_SORT_FETCH_SIZE = 100;

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    currentPage,
    pageSize,
    total,
    isLoading,
    filters,
    setProducts,
    setLoading,
    error,
    setError,
    setCurrentPage,
    setTotal,
    setFilters,
  } = useProductStore();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const categoryParam = searchParams.get('categoryId') ?? searchParams.get('category_id');
  const categoryId = categoryParam
    ? Number(categoryParam)
    : undefined;

  useEffect(() => {
    apiGetProducts({ sort: 'latest', page: 1, size: 100 })
      .then((result) => {
        const nextCategories = Array.from(
          new Map(
            result.items
              .filter((product) => product.category_id)
              .map((product) => [product.category_id, { id: product.category_id, name: product.category }])
          ).values()
        );
        setCategories(nextCategories);
      })
      .catch(() => setCategories([]));
  }, [refreshToken]);

  useEffect(() => {
    const refresh = () => setRefreshToken((value) => value + 1);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRODUCT_UPDATED_EVENT) refresh();
    };

    window.addEventListener(PRODUCT_UPDATED_EVENT, refresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(PRODUCT_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const needsClientSort =
          filters.sort === 'stock_asc' ||
          filters.sort === 'stock_desc' ||
          filters.sort === 'popular';
        const serverSort =
          filters.sort === 'price_asc' || filters.sort === 'price_desc'
            ? filters.sort
            : 'latest';
        const result = await apiGetProducts({
          categoryId,
          sort: serverSort,
          keyword: filters.keyword,
          page: needsClientSort ? 1 : currentPage,
          size: needsClientSort ? CLIENT_SORT_FETCH_SIZE : pageSize,
        });

        const nextItems =
          filters.sort === 'stock_asc' || filters.sort === 'stock_desc'
            ? await Promise.all(
                result.items.map(async (product) => {
                  try {
                    return await apiGetProduct(product.id);
                  } catch {
                    return product;
                  }
                })
              )
            : [...result.items];

        if (filters.sort === 'stock_asc') {
          nextItems.sort((a, b) => a.stock - b.stock);
        } else if (filters.sort === 'stock_desc') {
          nextItems.sort((a, b) => b.stock - a.stock);
        } else if (filters.sort === 'popular') {
          nextItems.sort((a, b) => Number(a.is_soldout) - Number(b.is_soldout) || b.id - a.id);
        }

        const visibleItems = needsClientSort
          ? nextItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
          : nextItems;

        setProducts(visibleItems);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to load products:', err);
        setProducts([]);
        setTotal(0);
        setError((err as { message?: string }).message ?? '상품 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryId, filters.sort, filters.keyword, currentPage, pageSize, refreshToken, setProducts, setLoading, setError, setTotal]);

  const handleCategoryClick = (id: number) => {
    setSearchParams({
      categoryId: String(id),
      ...(keyword ? { keyword } : {}),
    });
    setCurrentPage(1);
    setRefreshToken((value) => value + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ keyword });
    setSearchParams({
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
      ...(keyword ? { keyword } : {}),
    });
    setCurrentPage(1);
    setRefreshToken((value) => value + 1);
  };

  const handleSortChange = (sort: ProductListSort) => {
    setFilters({ sort });
    setCurrentPage(1);
    setRefreshToken((value) => value + 1);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const maxPage = Math.ceil(total / pageSize);
  const pages = Array.from({ length: maxPage }, (_, i) => i + 1);

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: 6 }}>
            상품
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>맛있는 스낵을 골라보세요.</p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="상품 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                background: 'white',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              }}
            />
            <Button type="submit">검색</Button>
          </form>

          {/* Filters & Sort */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Categories */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ id: 0, name: '전체' }, ...categories].map((cat) => {
                const active = cat.id === 0 ? !categoryId : categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      cat.id === 0
                        ? (setSearchParams({}), setCurrentPage(1), setRefreshToken((v) => v + 1))
                        : handleCategoryClick(cat.id)
                    }
                    style={{
                      padding: '8px 16px',
                      border: '1px solid ' + (active ? '#0f172a' : '#e2e8f0'),
                      borderRadius: 999,
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      background: active ? '#0f172a' : 'white',
                      color: active ? 'white' : '#334155',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
              {[
                { value: 'latest' as const, label: '최신순' },
                { value: 'price_asc' as const, label: '가격 낮은순' },
                { value: 'price_desc' as const, label: '가격 높은순' },
                { value: 'stock_asc' as const, label: '재고 적은순' },
                { value: 'stock_desc' as const, label: '재고 많은순' },
                { value: 'popular' as const, label: '인기순' },
              ].map((opt) => {
                const active = filters.sort === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      fontSize: 12,
                      background: active ? '#f1f5f9' : 'transparent',
                      color: active ? '#0f172a' : '#64748b',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div style={{ marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩중...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            결과가 없습니다.
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 20,
                marginBottom: 32,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-4px)';
                    el.style.boxShadow = '0 10px 24px rgba(15,23,42,0.08)';
                    el.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)';
                    el.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#f8fafc', overflow: 'hidden' }}>
                    {isRenderableImageUrl(product.thumbnail_url) ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '13px',
                        }}
                      >
                        이미지 준비중
                      </div>
                    )}
                    {/* Badges */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {product.stock > 0 && product.stock < 10 && !product.is_soldout && (
                        <span
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: 999,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }}
                        >
                          임박 {product.stock}개
                        </span>
                      )}
                    </div>
                    {product.is_soldout && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(1px)',
                        }}
                      >
                        <span
                          style={{
                            padding: '8px 20px',
                            background: 'rgba(255,255,255,0.95)',
                            color: '#0f172a',
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                        >
                          품절
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {product.category}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0f172a',
                        marginBottom: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                      ₩{product.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {maxPage > 1 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: 'white',
                    color: '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    fontSize: 13,
                  }}
                >
                  ← 이전
                </button>

                {pages.map((p) => {
                  const active = p === currentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid ' + (active ? '#0f172a' : '#e2e8f0'),
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: active ? 700 : 500,
                        background: active ? '#0f172a' : 'white',
                        color: active ? 'white' : '#334155',
                        fontSize: 13,
                        minWidth: 40,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                  disabled={currentPage === maxPage}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: 'white',
                    color: '#334155',
                    cursor: currentPage === maxPage ? 'not-allowed' : 'pointer',
                    opacity: currentPage === maxPage ? 0.4 : 1,
                    fontSize: 13,
                  }}
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
