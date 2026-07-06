import { Link } from 'react-router-dom';
import { ArrowRight, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { products, categories } from '@/mocks/products';
import { useCouponStore, type CouponBoard } from '@/stores/couponStore';
import type { Product } from '@/types';

const TOP_LIMIT = 8;
const PER_CATEGORY = 4;

export function Home() {
  const activeProducts = products.filter((p) => p.status === 'ACTIVE');
  const topProducts = activeProducts.slice(0, TOP_LIMIT);
  const eventBoards = useCouponStore((s) => s.getCouponBoards()).filter(
    (b) => b.is_active
  );

  return (
    <div className="flex flex-col gap-14">
      <HeroBanner />

      <Section
        title="지금 인기 있는 스낵"
        subtitle="오늘 잘 나가는 상품만 골라봤어요"
        moreTo="/products"
      >
        <ProductGrid products={topProducts} />
      </Section>

      {eventBoards.length > 0 && <EventBanner boards={eventBoards} />}

      {categories.map((category) => {
        const items = activeProducts
          .filter((p) => p.category_id === category.id)
          .slice(0, PER_CATEGORY);

        return (
          <Section
            key={category.id}
            title={category.name}
            moreTo={`/products?category_id=${category.id}`}
          >
            {items.length > 0 ? (
              <ProductGrid products={items} />
            ) : (
              <EmptyCategory />
            )}
          </Section>
        );
      })}
    </div>
  );
}

/* --- Sub-sections ------------------------------------------------------- */

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-100 px-8 py-14 md:px-14 md:py-20">
      <div className="relative z-10 flex max-w-2xl flex-col gap-4">
        <Badge tone="brand" className="w-fit">
          오늘의 딜
        </Badge>
        <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
          오늘의 딜, 지금 담아요
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
  const isSoldOut = product.stock === 0;
  const category = categories.find((c) => c.id === product.category_id);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-s1 transition-all hover:shadow-s2 active:scale-[0.99]"
    >
      <div className="relative aspect-square bg-ink-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <Package size={36} strokeWidth={1.5} />
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge tone="gray" className="bg-white/95 text-ink-900">
              품절
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {category && (
          <span className="text-xs text-ink-500">{category.name}</span>
        )}
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

function EventBanner({ boards }: { boards: CouponBoard[] }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink-900 md:text-2xl">
            진행 중인 이벤트
          </h2>
          <p className="text-sm text-ink-500">쿠폰 받고 더 알뜰하게 구매하세요</p>
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
                {formatPeriod(board.start_at, board.end_at)}
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
      곧 새로운 상품이 준비될 예정이에요.
    </div>
  );
}

function formatPeriod(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate()
    ).padStart(2, '0')}`;
  return `${fmt(f)} ~ ${fmt(t)}`;
}
