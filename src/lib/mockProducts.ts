// Mock product data
export interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail_url: string;
  image_url: string;
  category_id: number;
  category: string;
  description: string;
  stock: number;
  is_soldout: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: '허니버터 프레첼',
    price: 4500,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Honey+Butter+Pretzel',
    image_url: 'https://via.placeholder.com/500x500?text=Honey+Butter+Pretzel',
    category_id: 1,
    category: '스낵',
    description: '달콤한 허니버터 시즈닝이 코팅된 바삭한 프레첼입니다.',
    stock: 15,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: '초코칩 쿠키',
    price: 3500,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Choco+Chip+Cookie',
    image_url: 'https://via.placeholder.com/500x500?text=Choco+Chip+Cookie',
    category_id: 1,
    category: '스낵',
    description: '풍부한 초콜릿 칩이 가득한 부드러운 쿠키.',
    stock: 0,
    is_soldout: true,
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: '옥수수 스낵',
    price: 2500,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Corn+Snack',
    image_url: 'https://via.placeholder.com/500x500?text=Corn+Snack',
    category_id: 1,
    category: '스낵',
    description: '신선한 옥수수 맛이 살아있는 건강한 스낵.',
    stock: 8,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 4,
    name: '딸기 요거트 볼',
    price: 5500,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Strawberry+Yogurt',
    image_url: 'https://via.placeholder.com/500x500?text=Strawberry+Yogurt',
    category_id: 2,
    category: '건강식품',
    description: '신선한 딸기와 요거트의 완벽한 조화.',
    stock: 12,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 5,
    name: '견과류 믹스',
    price: 6500,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Nut+Mix',
    image_url: 'https://via.placeholder.com/500x500?text=Nut+Mix',
    category_id: 2,
    category: '건강식품',
    description: '다양한 견과류의 영양을 한 번에.',
    stock: 3,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 6,
    name: '초콜릿 바',
    price: 3000,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Chocolate+Bar',
    image_url: 'https://via.placeholder.com/500x500?text=Chocolate+Bar',
    category_id: 3,
    category: '초콜릿',
    description: '부드러운 초콜릿의 진한 맛.',
    stock: 25,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 7,
    name: '아몬드 초콜릿',
    price: 4000,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Almond+Chocolate',
    image_url: 'https://via.placeholder.com/500x500?text=Almond+Chocolate',
    category_id: 3,
    category: '초콜릿',
    description: '고소한 아몬드와 달콤한 초콜릿.',
    stock: 18,
    is_soldout: false,
    status: 'ACTIVE',
  },
  {
    id: 8,
    name: '그래놀라 바',
    price: 2800,
    thumbnail_url: 'https://via.placeholder.com/200x200?text=Granola+Bar',
    image_url: 'https://via.placeholder.com/500x500?text=Granola+Bar',
    category_id: 2,
    category: '건강식품',
    description: '귀리와 견과류로 만든 건강한 바.',
    stock: 0,
    is_soldout: true,
    status: 'ACTIVE',
  },
];

export const mockProductApi = {
  listProducts: async (params: {
    category_id?: number;
    sort?: 'latest' | 'price_asc' | 'price_desc';
    keyword?: string;
    page?: number;
    size?: number;
  }) => {
    const {
      category_id,
      sort = 'latest',
      keyword = '',
      page = 1,
      size = 20,
    } = params;

    let results = PRODUCTS.filter(
      (p) =>
        p.status === 'ACTIVE' &&
        (!category_id || p.category_id === category_id) &&
        (!keyword || p.name.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Sort
    if (sort === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else {
      results.reverse(); // latest
    }

    const total = results.length;
    const start = (page - 1) * size;
    const items = results.slice(start, start + size);

    return {
      items,
      page,
      size,
      total,
    };
  },

  getProduct: async (productId: number) => {
    const product = PRODUCTS.find((p) => p.id === productId && p.status === 'ACTIVE');
    if (!product) {
      throw new Error('404: Product not found');
    }
    return product;
  },
};
