import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { id: 1, name: '스낵' },
  { id: 2, name: '건강식품' },
  { id: 3, name: '초콜릿' },
];

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { adminSession } = useAdminAuthStore();
  const { products } = useProductStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<{ [key: string]: boolean }>({
    ACTIVE: true,
    INACTIVE: true,
    DISCONTINUED: true,
  });
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sort, setSort] = useState<'latest' | 'stock_asc' | 'stock_desc' | 'price'>('latest');

  if (!adminSession) return null;

  let results = products.filter((p) => {
    if (searchKeyword && !p.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    if (filterCategory && p.category_id !== filterCategory) return false;
    if (!filterStatus[p.status]) return false;
    if (filterLowStock && p.stock >= 10) return false;
    return true;
  });

  if (sort === 'stock_asc') {
    results = results.sort((a, b) => a.stock - b.stock);
  } else if (sort === 'stock_desc') {
    results = results.sort((a, b) => b.stock - a.stock);
  } else if (sort === 'price') {
    results = results.sort((a, b) => b.price - a.price);
  } else {
    results = results.reverse();
  }

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>상품 관리</h1>
          <Button onClick={() => navigate('/admin/products/new')}>상품 등록</Button>
        </div>

        {/* Filters */}
        <div style={{ background: '#f9f9f9', borderRadius: '4px', padding: '16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
              검색
            </label>
            <input
              type="text"
              placeholder="상품명"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
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
              {CATEGORIES.map((cat) => (
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
              {['ACTIVE', 'INACTIVE', 'DISCONTINUED'].map((status) => (
                <label key={status} style={{ display: 'flex', gap: '4px', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterStatus[status]}
                    onChange={(e) => setFilterStatus({ ...filterStatus, [status]: e.target.checked })}
                  />
                  {status === 'ACTIVE' ? '판매중' : status === 'INACTIVE' ? '품절' : '판매중지'}
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
              <option value="price">가격순</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            결과가 없습니다.
          </div>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
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
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '2px' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{product.name}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{product.category}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>
                      ₩{product.price.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '13px',
                        color: product.stock < 10 ? '#ff6b6b' : '#333',
                        fontWeight: product.stock < 10 ? '600' : 'normal',
                      }}
                    >
                      {product.stock}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <select
                        value={product.status}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        <option value="ACTIVE">판매중</option>
                        <option value="INACTIVE">품절</option>
                        <option value="DISCONTINUED">판매중지</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {new Date(product.image_url).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '11px',
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
