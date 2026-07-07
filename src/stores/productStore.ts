import { create } from 'zustand';
import { Product } from '@/lib/mockProducts';

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  total: number;
  filters: {
    categoryId?: number;
    sort: 'latest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'popular';
    keyword: string;
  };
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 20,
  total: 0,
  filters: {
    sort: 'latest',
    keyword: '',
  },
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setTotal: (total) => set({ total }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
