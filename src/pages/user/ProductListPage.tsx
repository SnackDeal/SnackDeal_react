import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { mockProductApi } from '@/lib/mockProducts';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { id: 1, name: '스낵' },
  { id: 2, name: '건강식품' },
  { id: 3, name: '초콜릿' },
];

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
    setCurrentPage,
    setTotal,
    setFilters,
  } = useProductStore();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const categoryId = searchParams.get('category_id')
    ? Number(searchParams.get('category_id'))
    : undefined;

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await mockProductApi.listProducts({
          category_id: categoryId,
          sort: filters.sort,
          keyword: filters.keyword,
          page: currentPage,
          size: pageSize,
        });
        setProducts(result.items);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryId, filters.sort, filters.keyword, currentPage, pageSize, setProducts, setLoading, setTotal]);

  const handleCategoryClick = (id: number) => {
    setSearchParams({ category_id: String(id) });
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ keyword });
    setSearchParams({ keyword });
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'latest' | 'price_asc' | 'price_desc' | 'popular') => {
    setFilters({ sort });
    setCurrentPage(1);
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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
            상품
          </h1>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="상품 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <Button type="submit">검색</Button>
          </form>

          {/* Filters & Sort */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Categories */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSearchParams({})}
                style={{
                  padding: '8px 16px',
                  border: !categoryId ? '2px solid #333' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: !categoryId ? 'bold' : 'normal',
                  background: !categoryId ? '#f0f0f0' : 'white',
                }}
              >
                전체
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    padding: '8px 16px',
                    border: categoryId === cat.id ? '2px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: categoryId === cat.id ? 'bold' : 'normal',
                    background: categoryId === cat.id ? '#f0f0f0' : 'white',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              {[
                { value: 'latest' as const, label: '최신순' },
                { value: 'price_asc' as const, label: '가격 낮은순' },
                { value: 'price_desc' as const, label: '가격 높은순' },
                { value: 'popular' as const, label: '인기순' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  style={{
                    padding: '8px 12px',
                    border: filters.sort === opt.value ? '2px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: filters.sort === opt.value ? 'bold' : 'normal',
                    fontSize: '12px',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #eee',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-4px)';
                    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#f5f5f5', overflow: 'hidden' }}>
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
                    {/* Badges */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {product.is_soldout && (
                        <span
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: '#333',
                            color: 'white',
                            borderRadius: '2px',
                          }}
                        >
                          품절
                        </span>
                      )}
                      {product.stock > 0 && product.stock < 10 && !product.is_soldout && (
                        <span
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: '#ff6b6b',
                            color: 'white',
                            borderRadius: '2px',
                          }}
                        >
                          임박
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      {product.category}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      ₩{product.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {maxPage > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  ← 이전
                </button>

                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '8px 12px',
                      border: p === currentPage ? '2px solid #333' : '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: p === currentPage ? 'bold' : 'normal',
                      background: p === currentPage ? '#f0f0f0' : 'white',
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                  disabled={currentPage === maxPage}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: currentPage === maxPage ? 'not-allowed' : 'pointer',
                    opacity: currentPage === maxPage ? 0.5 : 1,
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
