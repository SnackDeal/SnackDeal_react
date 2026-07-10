import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  apiGetEventCouponBoards,
  apiGetProduct,
  apiGetProducts,
  type EventCouponBoard,
} from '@/lib/api';
import type { Product } from '@/lib/mockProducts';

const TOP_LIMIT = 8;
const PER_CATEGORY = 4;
const PRODUCT_UPDATED_EVENT = 'snackdeal-products-updated';

function isRenderableImageUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export function Home() {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [categorySections, setCategorySections] = useState<
    Array<{ id: number; name: string; products: Product[] }>
  >([]);
  const [eventBoards, setEventBoards] = useState<EventCouponBoard[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    apiGetProducts({ sort: 'latest', page: 1, size: 50 })
      .then(async (result) => {
        const hydratedProducts = await Promise.all(
          result.items.map(async (product) => {
            try {
              return await apiGetProduct(product.id);
            } catch {
              return product;
            }
          })
        );

        const activeProducts = hydratedProducts.filter((product) => product.status === 'ACTIVE');
        const grouped = new Map<number, { id: number; name: string; products: Product[] }>();

        activeProducts.forEach((product) => {
          const section = grouped.get(product.category_id) ?? {
            id: product.category_id,
            name: product.category,
            products: [],
          };
          section.products.push(product);
          grouped.set(product.category_id, section);
        });

        setTopProducts(activeProducts.slice(0, TOP_LIMIT));
        setCategorySections(
          Array.from(grouped.values()).map((section) => ({
            ...section,
            products: section.products.slice(0, PER_CATEGORY),
          }))
        );
      })
      .catch(() => {
        setTopProducts([]);
        setCategorySections([]);
      });
  }, [refreshToken]);

  useEffect(() => {
    apiGetEventCouponBoards()
      .then((rows) => {
        const now = new Date();
        const active = rows.filter((board) => {
          const start = new Date(board.startAt);
          const end = board.endAt ? new Date(board.endAt) : null;
          return start <= now && (end === null || now <= end);
        });
        setEventBoards(active);
      })
      .catch(() => setEventBoards([]));
  }, []);

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

  return (
    <div className="flex flex-col gap-14">
      <HeroBanner />

      <Section
        title="새로 들어온 상품"
        subtitle="최근 등록된 상품을 먼저 보여드려요"
        moreTo="/products"
      >
        <ProductGrid products={topProducts} />
      </Section>

      {eventBoards.length > 0 && <EventBanner boards={eventBoards} />}

      {categorySections.map((category) => (
        <Section
          key={category.id}
          title={category.name}
          moreTo={`/products?categoryId=${category.id}`}
        >
          {category.products.length > 0 ? (
            <ProductGrid products={category.products} />
          ) : (
            <EmptyCategory />
          )}
        </Section>
      ))}
    </div>
  );
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-100 px-8 py-14 md:px-14 md:py-20">
      <div className="relative z-10 flex max-w-2xl flex-col gap-4">
        <Badge tone="brand" className="w-fit">
          오늘의 추천
        </Badge>
        <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
          오늘의 간식을 지금 바로 만나보세요
        </h1>
        <p className="text-base text-ink-600 md:text-lg">
          매일 새로 올라오는 과자를 부담 없는 가격에 만나보세요.
        </p>
        <div className="mt-2 flex gap-2">
          <Link to="/products">
            <Button size="lg">전체 상품 보기</Button>
          </Link>
          <Link to="/event">
            <Button size="lg" variant="outline">
              이벤트 확인하기
            </Button>
          </Link>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-200/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-brand-100 blur-3xl"
      />
    </section>
  );
}

function Section({
  title,
  subtitle,
  moreTo,
  children,
}: {
  title: string;
  subtitle?: string;
  moreTo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-ink-900 md:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        </div>
        {moreTo && (
          <Link
            to={moreTo}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            전체 보기
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isSoldOut = product.stock === 0 || product.is_soldout;
  const isLowStock = !isSoldOut && product.stock > 0 && product.stock < 10;
  const imageUrl = isRenderableImageUrl(product.image_url) ? product.image_url : '';

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-s1 transition-all hover:shadow-s2 active:scale-[0.99]"
    >
      <div className="relative aspect-square bg-ink-100">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <Package size={36} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute right-2.5 top-2.5 flex flex-wrap gap-1">
          {isLowStock && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              임박상품
            </span>
          )}
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold text-ink-900 shadow-md">
              품절
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-xs text-ink-500">{product.category}</span>
        <p className="line-clamp-1 text-sm font-medium text-ink-900 group-hover:text-brand-700">
          {product.name}
        </p>
        <p className="mt-auto pt-1 text-base font-bold text-ink-900">
          {product.price.toLocaleString()}
          <span className="ml-0.5 text-sm font-medium text-ink-500">원</span>
        </p>
      </div>
    </Link>
  );
}

function EventBanner({ boards }: { boards: EventCouponBoard[] }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink-900 md:text-2xl">진행 중인 이벤트</h2>
          <p className="text-sm text-ink-500">쿠폰 받고 더 알뜰하게 구매해보세요.</p>
        </div>
        <Link
          to="/event"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          전체 보기
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {boards.slice(0, 2).map((board) => (
          <Link
            key={board.id}
            to="/event"
            className="group relative flex overflow-hidden rounded-xl border border-black/[0.06] bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-s1 transition-all hover:shadow-s2 active:scale-[0.99]"
          >
            <div className="relative z-10 flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-50">
                <Tag size={12} />
                EVENT
              </div>
              <h3 className="text-lg font-bold leading-tight">{board.title}</h3>
              <p className="line-clamp-2 text-sm text-white/85">{board.content}</p>
              <span className="mt-auto pt-3 text-xs text-white/70">
                {formatPeriod(board.startAt, board.endAt)}
              </span>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyCategory() {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-ink-200 text-sm text-ink-500">
      곧 새로운 상품을 준비해둘 예정이에요.
    </div>
  );
}

function formatPeriod(from: string, to: string | null) {
  const f = new Date(from);
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate()
    ).padStart(2, '0')}`;
  return `${fmt(f)} ~ ${to ? fmt(new Date(to)) : '상시'}`;
}
