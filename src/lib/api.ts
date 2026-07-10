/**
 * API 클라이언트 — 백엔드 연동용.
 * 백엔드 미기동 시 mock 데이터로 fallback.
 * 모든 응답은 CommonResponse<T> { success, code, message, data } 래퍼.
 */

// VITE_API_URL 이 설정되면 해당 주소로, 비어있으면 Vite 프록시(상대경로) 사용
import { formatPhoneNumberForStorage } from '@/lib/phone';
import type { Product } from '@/lib/mockProducts';
import type { NoticeResponse, NoticeSummaryResponse, QnaType } from '@/types';

const configuredBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
const configuredChatbotBaseUrl = ((import.meta.env.VITE_CHATBOT_API_URL as string | undefined) ?? '').trim();
const PRODUCTION_API_URL = 'https://snackdealapi.mite88.site';

function isLocalBrowser() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

const BASE_URL = (() => {
  if (!configuredBaseUrl) return isLocalBrowser() ? '' : PRODUCTION_API_URL;

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configuredBaseUrl.startsWith('http://')
  ) {
    console.warn(
      'VITE_API_URL uses http on an https page. Falling back to same-origin API proxy.'
    );
    return '';
  }

  return configuredBaseUrl.replace(/\/$/, '');
})();

const CHATBOT_BASE_URL = (() => {
  if (!configuredChatbotBaseUrl) return BASE_URL;

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configuredChatbotBaseUrl.startsWith('http://')
  ) {
    console.warn(
      'VITE_CHATBOT_API_URL uses http on an https page. Falling back to the default API base URL.'
    );
    return BASE_URL;
  }

  return configuredChatbotBaseUrl.replace(/\/$/, '');
})();

// ─── 공통 ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' } as ApiError;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    throw {
      code: body.code ?? 'UNKNOWN',
      message: body.message ?? `요청에 실패했습니다. (${res.status})`,
      status: res.status,
    } as ApiError;
  }
  return (Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body) as T;
}

async function chatbotRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(`${CHATBOT_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' } as ApiError;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    throw {
      code: body.code ?? 'UNKNOWN',
      message: body.message ?? `요청에 실패했습니다. (${res.status})`,
      status: res.status,
    } as ApiError;
  }
  return (Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body) as T;
}

async function chatbotRawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(`${CHATBOT_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' } as ApiError;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw {
      code: body.code ?? 'UNKNOWN',
      message: body.message ?? `요청에 실패했습니다. (${res.status})`,
      status: res.status,
    } as ApiError;
  }

  return body as T;
}

async function fileRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' } as ApiError;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    throw {
      code: body.code ?? 'UNKNOWN',
      message: body.message ?? `요청에 실패했습니다. (${res.status})`,
      status: res.status,
    } as ApiError;
  }

  return (Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body) as T;
}

export interface ChatbotResponse {
  answer: string;
}

/** POST /chatbot/ask */
export async function apiAskChatbot(message: string): Promise<ChatbotResponse> {
  return chatbotRequest('/chatbot/ask', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/** GET /health */
export async function apiHealthCheck(): Promise<{ status: string }> {
  return chatbotRawRequest('/health');
}

// ─── 파일 업로드 ─────────────────────────────────────────────────────────────

/** POST /file 🔒 */
export async function apiUploadFile(
  token: string,
  file: File,
  directory: string
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('directory', directory);

  return fileRequest('/file', {
    method: 'POST',
    body: formData,
  }, token);
}

/** DELETE /file?url=... 🔒 */
export async function apiDeleteFile(token: string, url: string): Promise<null> {
  return fileRequest(`/file?url=${encodeURIComponent(url)}`, {
    method: 'DELETE',
  }, token);
}

// ─── 상품 ────────────────────────────────────────────────────────────────────

export type ProductSort = 'latest' | 'price_asc' | 'price_desc';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

interface ProductSummaryResponse {
  id: number;
  name: string;
  price: number;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  imageUrl?: string;
  image_url?: string;
  categoryId?: number;
  category_id?: number;
  category: string;
  isSoldout?: boolean;
  is_soldout?: boolean;
  stock?: number;
  status?: ProductStatus;
}

interface ProductResponse {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  stock?: number;
  status?: ProductStatus;
  isSoldout?: boolean;
  is_soldout?: boolean;
  categoryId?: number;
  category_id?: number;
  category: string;
}

interface ProductPageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

function mapProductSummary(item: ProductSummaryResponse): Product {
  const thumbnailUrl = item.thumbnailUrl ?? item.thumbnail_url ?? item.imageUrl ?? item.image_url ?? '';
  const categoryId = item.categoryId ?? item.category_id ?? 0;
  const isSoldout = item.isSoldout ?? item.is_soldout ?? item.stock === 0;

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
    category_id: categoryId,
    category: item.category,
    description: '',
    stock: item.stock ?? (isSoldout ? 0 : 999),
    is_soldout: isSoldout,
    status: item.status ?? 'ACTIVE',
  };
}

function mapProductDetail(item: ProductResponse): Product {
  const imageUrl = item.imageUrl ?? item.image_url ?? item.thumbnailUrl ?? item.thumbnail_url ?? '';
  const categoryId = item.categoryId ?? item.category_id ?? 0;
  const stock = item.stock ?? 0;
  const isSoldout = item.isSoldout ?? item.is_soldout ?? stock === 0;

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    thumbnail_url: imageUrl,
    image_url: imageUrl,
    category_id: categoryId,
    category: item.category,
    description: item.description ?? '',
    stock,
    is_soldout: isSoldout,
    status: item.status ?? 'ACTIVE',
  };
}

/** GET /product/list */
export async function apiGetProducts(params: {
  keyword?: string;
  categoryId?: number;
  sort?: ProductSort;
  page?: number;
  size?: number;
} = {}): Promise<ProductPageResponse<Product>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.categoryId) q.set('categoryId', String(params.categoryId));
  q.set('sort', params.sort ?? 'latest');
  q.set('page', String(params.page ?? 1));
  q.set('size', String(params.size ?? 10));

  const data = await request<
    ProductPageResponse<ProductSummaryResponse> & {
      content?: ProductSummaryResponse[];
      totalElements?: number;
      totalPages?: number;
    }
  >(`/product/list?${q}`);
  if (!data) {
    throw { code: 'EMPTY_RESPONSE', message: '상품 목록 응답이 비어있습니다.' } as ApiError;
  }
  const items = data.items ?? data.content ?? [];

  return {
    ...data,
    items: items.map(mapProductSummary),
    total: data.total ?? data.totalElements ?? items.length,
  };
}

/** GET /product/{productId} */
export async function apiGetProduct(productId: number): Promise<Product> {
  const data = await request<ProductResponse>(`/product/${productId}`);
  return mapProductDetail(data);
}

export interface AdminProductListItem {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  thumbnailUrl: string;
}

export interface AdminProductDetail {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  price: number;
  description: string;
  stock: number;
  status: ProductStatus;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductPayload {
  name: string;
  price: number;
  categoryId: number;
  description?: string;
  stock: number;
  imageUrl: string;
  status: ProductStatus;
}

/** GET /admin/product */
export async function apiGetAdminProducts(
  token: string,
  params: {
    keyword?: string;
    categoryId?: number;
    status?: ProductStatus;
    lowStock?: boolean;
    sort?: string;
    page?: number;
    size?: number;
  } = {}
): Promise<ProductPageResponse<AdminProductListItem>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.categoryId) q.set('categoryId', String(params.categoryId));
  if (params.status) q.set('status', params.status);
  if (params.lowStock) q.set('lowStock', 'true');
  q.set('sort', params.sort ?? 'latest');
  q.set('page', String(params.page ?? 1));
  q.set('size', String(params.size ?? 10));
  return request(`/admin/product?${q}`, {}, token);
}

/** POST /admin/product */
export async function apiCreateAdminProduct(
  token: string,
  payload: AdminProductPayload
): Promise<AdminProductDetail> {
  return request('/admin/product', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** GET /admin/product/{id} */
export async function apiGetAdminProduct(token: string, id: number): Promise<AdminProductDetail> {
  return request(`/admin/product/${id}`, {}, token);
}

/** PUT /admin/product/{id} */
export async function apiUpdateAdminProduct(
  token: string,
  id: number,
  payload: AdminProductPayload
): Promise<AdminProductDetail> {
  return request(`/admin/product/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

/** PATCH /admin/product/{id}/status */
export async function apiUpdateAdminProductStatus(
  token: string,
  id: number,
  status: ProductStatus
): Promise<{ id: number; status: ProductStatus; updatedAt: string }> {
  return request(`/admin/product/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, token);
}

/** GET /shipping-policy */
export async function apiGetPublicShippingPolicy(): Promise<ShippingPolicy> {
  return request('/shipping-policy');
}

// ─── 회원 ────────────────────────────────────────────────────────────────────

export interface MemberDescription {
  id: number;
  email: string;
  name: string;
  phone: string;
  birth: string;
  gender: 'MALE' | 'FEMALE';
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  role: 'USER' | 'ADMIN';
  createdAt: string;
  lastLogin: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** POST /member/email/send-code */
export async function apiSendCode(email: string): Promise<{ expiresIn: number }> {
  return request('/member/email/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** POST /member/email/verify-code */
export async function apiVerifyCode(
  email: string,
  code: string
): Promise<{ verificationToken: string; expiresIn: number }> {
  return request('/member/email/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export interface JoinResponse extends MemberDescription {
  accessToken?: string;
  refreshToken?: string;
}

/** POST /member/join */
export async function apiJoin(payload: {
  email: string;
  name: string;
  phone: string;
  birth: string;
  gender: 'MALE' | 'FEMALE';
  password?: string;
  verificationToken?: string;
  isSocialLogin?: boolean;
}): Promise<JoinResponse> {
  return request('/member/join', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      phone: formatPhoneNumberForStorage(payload.phone),
    }),
  });
}

/** POST /member/login */
export async function apiLogin(
  email: string,
  password: string
): Promise<TokenPair> {
  return request('/member/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ─── 구글 소셜 로그인(OAuth2) ─────────────────────────────────────────────────

/**
 * 구글 OAuth2 로그인 진입 URL.
 * 백엔드가 구글 동의 화면으로 리다이렉트한다. (Spring Security oauth2Login)
 * VITE_API_URL 이 비어있으면 상대경로 → Vite 프록시(`/oauth2`)를 탄다.
 */
export const GOOGLE_LOGIN_URL = `${BASE_URL}/oauth2/authorization/google`;

/**
 * "구글로 로그인" 버튼 핸들러.
 * fetch/axios 가 아니라 **브라우저 전체를 백엔드 진입점으로 이동**시키는 것이 핵심.
 * (Authorization Code 흐름은 백엔드가 처리하고, 콜백에서 토큰을 돌려준다)
 */
export function loginWithGoogle(): void {
  window.location.href = GOOGLE_LOGIN_URL;
}

/** POST /member/token/refresh */
export async function apiRefreshToken(refreshToken: string): Promise<TokenPair> {
  return request('/member/token/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/** POST /member/logout 🔒 */
export async function apiLogout(token: string): Promise<void> {
  await request('/member/logout', { method: 'POST' }, token);
}

/** POST /admin/logout 👑 */
export async function apiAdminLogout(token: string): Promise<void> {
  await request('/admin/logout', { method: 'POST' }, token);
}

/** GET /member/me 🔒 */
export async function apiGetMe(token: string): Promise<MemberDescription> {
  return request('/member/me', {}, token);
}

/** PATCH /member/me 🔒 */
export async function apiUpdateMe(
  token: string,
  payload: { phone?: string; birth?: string; gender?: 'MALE' | 'FEMALE'; currentPassword?: string; password?: string }
): Promise<MemberDescription> {
  return request(
    '/member/me',
    {
      method: 'PATCH',
      body: JSON.stringify({
        ...payload,
        ...(payload.phone ? { phone: formatPhoneNumberForStorage(payload.phone) } : {}),
      }),
    },
    token
  );
}

// ─── 관리자 로그인/메인 ───────────────────────────────────────────────────────

/** POST /admin/login */
export async function apiAdminLogin(
  email: string,
  password: string
): Promise<TokenPair> {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface DashboardData {
  todayOrderCount: number;
  todaySalesAmount: number;
  newMemberCount: number;
  lowStockProductCount: number;
  pendingQnaCount: number;
}

export interface DashboardChartDateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardMemberChartItem {
  date: string;
  count: number;
}

export interface DashboardOrderChartItem {
  date: string;
  count: number;
}

export interface DashboardSalesChartItem {
  date: string;
  salesAmount: number;
  soldQuantity: number;
}

export interface DashboardCouponChartItem {
  date: string;
  issuedCount: number;
  usedCount: number;
}

function buildDashboardChartQuery(params: DashboardChartDateRange) {
  const query = new URLSearchParams();
  query.set('startDate', params.startDate);
  query.set('endDate', params.endDate);
  return query.toString();
}

/** GET /admin/main 👑 */
export async function apiGetDashboard(token: string): Promise<DashboardData> {
  return request('/admin/main', {}, token);
}

export async function apiGetDashboardMemberChart(
  token: string,
  params: DashboardChartDateRange
): Promise<{ items: DashboardMemberChartItem[] }> {
  return request(`/admin/main/chart/members?${buildDashboardChartQuery(params)}`, {}, token);
}

export async function apiGetDashboardOrderChart(
  token: string,
  params: DashboardChartDateRange
): Promise<{ items: DashboardOrderChartItem[] }> {
  return request(`/admin/main/chart/orders?${buildDashboardChartQuery(params)}`, {}, token);
}

export async function apiGetDashboardSalesChart(
  token: string,
  params: DashboardChartDateRange
): Promise<{ items: DashboardSalesChartItem[] }> {
  return request(`/admin/main/chart/sales?${buildDashboardChartQuery(params)}`, {}, token);
}

export async function apiGetDashboardCouponChart(
  token: string,
  params: DashboardChartDateRange
): Promise<{ items: DashboardCouponChartItem[] }> {
  return request(`/admin/main/chart/coupons?${buildDashboardChartQuery(params)}`, {}, token);
}

// ─── 관리자 회원 관리 ─────────────────────────────────────────────────────────

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** GET /admin/members 👑 */
export async function apiGetAdminMembers(
  token: string,
  params: { keyword?: string; status?: string; page?: number; size?: number }
): Promise<PageResult<MemberDescription>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.status) q.set('status', params.status);
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 10));
  return request(`/admin/members?${q}`, {}, token);
}

/** GET /admin/members/{id} 👑 */
export async function apiGetAdminMember(
  token: string,
  id: number
): Promise<MemberDescription> {
  return request(`/admin/members/${id}`, {}, token);
}

export interface MemberStatusResponse {
  id: number;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  updatedAt: string;
}

/** PATCH /admin/members/{id}/status 👑 */
export async function apiUpdateMemberStatus(
  token: string,
  id: number,
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED',
  reason: string
): Promise<MemberStatusResponse> {
  return request(
    `/admin/members/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status, reason }) },
    token
  );
}

// ─── 쿠폰 (사용자) ────────────────────────────────────────────────────────────

export interface MyCoupon {
  userCouponId: number;
  couponId: number;
  couponName: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrderPrice: number;
  validUntil: string | null;
  issueType: 'EVENT' | 'SIGNIN';
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  issuedAt: string;
  usedAt: string | null;
}

type MyCouponResponse = {
  userCouponId?: number;
  user_coupon_id?: number;
  couponId?: number;
  coupon_id?: number;
  couponName?: string;
  coupon_name?: string;
  name?: string;
  discountType?: 'FIXED' | 'PERCENT';
  discount_type?: 'FIXED' | 'PERCENT';
  discountValue?: number;
  discount_value?: number;
  minOrderPrice?: number;
  min_order_price?: number;
  validUntil?: string | null;
  valid_until?: string | null;
  issueType?: 'EVENT' | 'SIGNIN';
  issue_type?: 'EVENT' | 'SIGNIN';
  status?: 'ACTIVE' | 'USED' | 'EXPIRED';
  issuedAt?: string;
  issued_at?: string;
  usedAt?: string | null;
  used_at?: string | null;
};

function mapMyCoupon(item: MyCouponResponse): MyCoupon {
  return {
    userCouponId: item.userCouponId ?? item.user_coupon_id ?? 0,
    couponId: item.couponId ?? item.coupon_id ?? 0,
    couponName: item.couponName ?? item.coupon_name ?? item.name ?? '',
    discountType: item.discountType ?? item.discount_type ?? 'FIXED',
    discountValue: item.discountValue ?? item.discount_value ?? 0,
    minOrderPrice: item.minOrderPrice ?? item.min_order_price ?? 0,
    validUntil: item.validUntil ?? item.valid_until ?? null,
    issueType: item.issueType ?? item.issue_type ?? 'EVENT',
    status: item.status ?? 'ACTIVE',
    issuedAt: item.issuedAt ?? item.issued_at ?? '',
    usedAt: item.usedAt ?? item.used_at ?? null,
  };
}

/** GET /mypage/coupon 🔒 */
export async function apiGetMyCoupons(
  token: string,
  status?: 'ACTIVE' | 'USED' | 'EXPIRED'
): Promise<MyCoupon[]> {
  const query = status ? `?status=${status}` : '';
  const data = await request<MyCouponResponse[] | { coupons?: MyCouponResponse[] } | null>(`/mypage/coupon${query}`, {}, token);
  if (!data) return [];
  const list = Array.isArray(data) ? data : data.coupons ?? [];
  return list.map(mapMyCoupon);
}

// ─── 이벤트 쿠폰 게시판 (사용자 공개) ────────────────────────────────────────

export type EventCouponState = 'open' | 'upcoming' | 'soldout' | 'closed';

export interface EventCoupon {
  id: number;
  name: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrderPrice: number;
  validFrom: string;
  validUntil: string | null;
  remainingQuantity: number | null;
  state: EventCouponState;
  alreadyDownloaded: boolean;
}

export interface EventCouponBoard {
  id: number;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  startAt: string;
  endAt: string | null;
  coupons?: EventCoupon[];
}

type EventCouponResponse = {
  id: number;
  name: string;
  discountType?: 'FIXED' | 'PERCENT';
  discount_type?: 'FIXED' | 'PERCENT';
  discountValue?: number;
  discount_value?: number;
  minOrderPrice?: number;
  min_order_price?: number;
  validFrom?: string;
  valid_from?: string;
  validUntil?: string | null;
  valid_until?: string;
  remainingQuantity?: number | null;
  remaining_quantity?: number | null;
  state?: EventCouponState;
  alreadyDownloaded?: boolean;
  already_downloaded?: boolean;
};

type EventCouponBoardResponse = {
  id: number;
  title: string;
  content?: string;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  startAt?: string;
  start_at?: string;
  endAt?: string | null;
  end_at?: string | null;
  coupons?: EventCouponResponse[];
};

type EventCouponBoardDetailResponse = {
  couponBoard?: EventCouponBoardResponse;
  coupon_board?: EventCouponBoardResponse;
  coupons?: EventCouponResponse[];
} & EventCouponBoardResponse;

function mapEventCoupon(item: EventCouponResponse): EventCoupon {
  return {
    id: item.id,
    name: item.name,
    discountType: item.discountType ?? item.discount_type ?? 'FIXED',
    discountValue: item.discountValue ?? item.discount_value ?? 0,
    minOrderPrice: item.minOrderPrice ?? item.min_order_price ?? 0,
    validFrom: item.validFrom ?? item.valid_from ?? '',
    validUntil: item.validUntil ?? item.valid_until ?? null,
    remainingQuantity: item.remainingQuantity ?? item.remaining_quantity ?? null,
    state: item.state ?? 'open',
    alreadyDownloaded: item.alreadyDownloaded ?? item.already_downloaded ?? false,
  };
}

function mapEventCouponBoard(item: EventCouponBoardResponse, coupons?: EventCouponResponse[]): EventCouponBoard {
  return {
    id: item.id,
    title: item.title,
    content: item.content ?? '',
    thumbnailUrl: item.thumbnailUrl ?? item.thumbnail_url ?? null,
    startAt: item.startAt ?? item.start_at ?? '',
    endAt: item.endAt ?? item.end_at ?? null,
    coupons: (coupons ?? item.coupons)?.map(mapEventCoupon),
  };
}

/** GET /event/coupon/list */
export async function apiGetEventCouponBoards(token?: string | null): Promise<EventCouponBoard[]> {
  const data = await request<
    EventCouponBoardResponse[] | { items?: EventCouponBoardResponse[]; content?: EventCouponBoardResponse[]; boards?: EventCouponBoardResponse[] } | null
  >('/event/coupon/list', {}, token ?? undefined);
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? data.content ?? data.boards ?? [];
  return list.map((item) => mapEventCouponBoard(item));
}

/** GET /event/coupon-board/{boardId} */
export async function apiGetEventCouponBoard(boardId: number, token?: string | null): Promise<EventCouponBoard> {
  const data = await request<EventCouponBoardDetailResponse>(`/event/coupon-board/${boardId}`, {}, token ?? undefined);
  const board = data.couponBoard ?? data.coupon_board ?? data;
  return mapEventCouponBoard(board, data.coupons ?? board.coupons);
}

/** POST /event/coupon/{couponId}/download 🔒 */
export async function apiDownloadEventCoupon(
  token: string,
  couponId: number
): Promise<{ userCouponId: number; couponId: number; name: string; status: string; issuedAt: string } | null> {
  return request(`/event/coupon/${couponId}/download`, { method: 'POST' }, token);
}

// ─── 주문 (사용자) ────────────────────────────────────────────────────────────

export interface OrderSummary {
  orderId: number;
  orderNumber: string;
  orderedAt: string;
  mainProductName: string;
  itemCount: number;
  finalAmount: number;
  status: string;
}

export interface OrderDetail {
  orderId: number;
  orderNumber: string;
  orderedAt: string;
  status: string;
  items: { productId: number; productName: string; price: number; quantity: number; lineTotal: number }[];
  shipping: {
    receiverName: string;
    receiverPhone: string;
    zipcode: string;
    address: string;
    detailAddress: string;
    deliveryRequest: string;
    courier: string | null;
    trackingNumber: string | null;
    status: string;
  };
  payment: {
    productAmount: number;
    shippingFee: number;
    couponName: string | null;
    discountAmount: number;
    finalAmount: number;
    payMethod: string;
    pgProvider: string;
    status: string;
    receiptUrl: string;
    paidAt: string;
  };
}

export interface ShippingRequest {
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  detailAddress?: string;
  deliveryRequest?: string;
}

export interface OrderPreparePayload {
  items: { productId: number; quantity: number }[];
  deliveryId?: number;
  shipping?: ShippingRequest | null;
  userCouponId?: number | null;
  shippingFee?: number;
}

export interface OrderPrepareResponse {
  paymentId: string;
  amount: number;
  productAmount?: number;
  shippingFee?: number;
  discountAmount?: number;
  finalAmount?: number;
  couponName?: string | null;
  storeId: string;
  channelKey: string;
  buyerEmail: string;
  buyerName: string;
  buyerTel: string;
}

export interface OrderCompleteResponse {
  orderId: number;
  orderNumber: string;
  status: string;
  productAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  payment: {
    paymentId: string;
    payMethod: string;
    pgProvider: string;
    status: string;
    receiptUrl: string;
  };
  paidAt: string;
}

/** POST /order/prepare 🔒 */
export async function apiPrepareOrder(
  token: string,
  payload: OrderPreparePayload
): Promise<OrderPrepareResponse> {
  return request('/order/prepare', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** POST /order/complete 🔒 */
export async function apiCompleteOrder(
  token: string,
  paymentId: string
): Promise<OrderCompleteResponse> {
  return request('/order/complete', {
    method: 'POST',
    body: JSON.stringify({ paymentId }),
  }, token);
}

/** GET /order/list 🔒 */
export async function apiGetOrders(
  token: string,
  page = 0,
  size = 10
): Promise<{ orders: OrderSummary[]; page: number; size: number; total: number }> {
  const data = await request<{
    orders?: OrderSummary[];
    content?: OrderSummary[];
    page: number;
    size: number;
    total?: number;
    totalElements?: number;
  }>(`/order/list?page=${page}&size=${size}`, {}, token);
  const orders = data.orders ?? data.content ?? [];
  return {
    orders,
    page: data.page,
    size: data.size,
    total: data.total ?? data.totalElements ?? orders.length,
  };
}

/** GET /order/{orderId} 🔒 */
export async function apiGetOrderDetail(token: string, orderId: number): Promise<OrderDetail> {
  return request(`/order/${orderId}`, {}, token);
}

/** POST /order/{orderId}/refund 🔒 */
export async function apiRequestRefund(
  token: string,
  orderId: number,
  reason: string
): Promise<{ orderId: number; orderNumber: string; status: string }> {
  return request(`/order/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }, token);
}

// ─── 관리자 주문 관리 ─────────────────────────────────────────────────────────

export interface AdminOrderSummary {
  orderId: number;
  orderNumber: string;
  buyerEmail: string;
  buyerName: string;
  mainProductName: string;
  finalAmount: number;
  status: string;
  orderedAt: string;
}

export interface AdminOrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  orderedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  manualOverride: boolean;
  buyer: { id: number; email: string; name: string; totalOrderCount: number };
  memo?: string | null;
  items: { productId: number; productName: string; price: number; quantity: number; lineTotal: number }[];
  shipping: {
    receiverName: string;
    receiverPhone: string;
    zipcode: string;
    address: string;
    detailAddress: string;
    deliveryRequest: string;
    courier: string | null;
    trackingNumber: string | null;
    status: string;
  };
  payment: {
    productAmount: number;
    shippingFee: number;
    usedCoupon: string | null;
    discountAmount: number;
    finalAmount: number;
    payMethod: string;
    pgProvider: string;
    status: string;
    paymentId: string;
  };
}

/** GET /admin/order 👑 */
export async function apiGetAdminOrders(
  token: string,
  params: { keyword?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; size?: number }
): Promise<{ orders: AdminOrderSummary[]; page: number; size: number; total: number }> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.status) q.set('status', params.status);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 20));
  return request(`/admin/order?${q}`, {}, token);
}

/** GET /admin/order/{id} 👑 */
export async function apiGetAdminOrderDetail(token: string, id: number): Promise<AdminOrderDetail> {
  return request(`/admin/order/${id}`, {}, token);
}

/** PATCH /admin/order/{id}/status 👑 */
export async function apiUpdateOrderStatus(
  token: string,
  id: number,
  status: string,
  opts?: { memo?: string; courier?: string; trackingNumber?: string }
): Promise<{ id: number; orderNumber: string; status: string; manualOverride: boolean; updatedAt: string; memo?: string }> {
  const body: Record<string, string> = { status };
  if (opts?.memo) body.memo = opts.memo;
  if (opts?.courier) body.courier = opts.courier;
  if (opts?.trackingNumber) body.trackingNumber = opts.trackingNumber;
  return request(
    `/admin/order/${id}/status`,
    { method: 'PATCH', body: JSON.stringify(body) },
    token
  );
}

/** POST /admin/order/{id}/refund 👑 */
export async function apiAdminRefund(
  token: string,
  id: number,
  payload: { approve: boolean; restoreStock?: boolean; rejectReason?: string }
): Promise<{ id: number; orderNumber: string; status: string }> {
  return request(`/admin/order/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

// ─── 관리자 FAQ ───────────────────────────────────────────────────────────────

export interface AdminFaq {
  id: number;
  type: QnaType;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFaqPayload {
  type: QnaType;
  title: string;
  content: string;
}

type AdminFaqResponse = AdminFaq & {
  created_at?: string;
  updated_at?: string;
};

function mapAdminFaq(item: AdminFaqResponse): AdminFaq {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    createdAt: item.createdAt ?? item.created_at ?? '',
    updatedAt: item.updatedAt ?? item.updated_at ?? '',
  };
}

/** GET /admin/cs/faq 👑 */
export async function apiGetAdminFaqs(token: string, type?: QnaType): Promise<AdminFaq[]> {
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  const data = await request<AdminFaqResponse[] | { items?: AdminFaqResponse[]; content?: AdminFaqResponse[] } | null>(
    `/admin/cs/faq${q.toString() ? `?${q.toString()}` : ''}`,
    {},
    token
  );
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? data.content ?? [];
  return list.map(mapAdminFaq);
}

/** GET /admin/cs/faq/{id} 👑 */
export async function apiGetAdminFaq(token: string, id: number): Promise<AdminFaq> {
  const data = await request<AdminFaqResponse>(`/admin/cs/faq/${id}`, {}, token);
  return mapAdminFaq(data);
}

/** POST /admin/cs/faq 👑 */
export async function apiCreateAdminFaq(token: string, payload: AdminFaqPayload): Promise<AdminFaq> {
  const data = await request<AdminFaqResponse>('/admin/cs/faq', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminFaq(data);
}

/** PUT /admin/cs/faq/{id} 👑 */
export async function apiUpdateAdminFaq(token: string, id: number, payload: AdminFaqPayload): Promise<AdminFaq> {
  const data = await request<AdminFaqResponse>(`/admin/cs/faq/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminFaq(data);
}

/** DELETE /admin/cs/faq/{id} 👑 */
export async function apiDeleteAdminFaq(token: string, id: number): Promise<null> {
  return request(`/admin/cs/faq/${id}`, { method: 'DELETE' }, token);
}

export interface PublicFaq {
  id: number;
  type: QnaType;
  title: string;
  content: string;
}

type PublicFaqResponse = PublicFaq & {
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
};

function mapPublicFaq(item: PublicFaqResponse): PublicFaq {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
  };
}

/** GET /cs/qna/faq */
export async function apiGetPublicFaqs(type?: QnaType): Promise<PublicFaq[]> {
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  const data = await request<PublicFaqResponse[] | { items?: PublicFaqResponse[]; content?: PublicFaqResponse[] } | null>(
    `/cs/qna/faq${q.toString() ? `?${q.toString()}` : ''}`
  );
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? data.content ?? [];
  return list.map(mapPublicFaq);
}

export interface QnaSummary {
  id: number;
  type: QnaType;
  title: string;
  answered: boolean;
  createdAt: string;
}

export interface QnaDetail extends QnaSummary {
  content: string;
  attachmentUrl: string | null;
  answerContent: string | null;
  answeredAt: string | null;
}

export interface QnaUpsertPayload {
  type: QnaType;
  title: string;
  content: string;
  attachmentUrl?: string | null;
}

export interface QnaAnswerPayload {
  content: string;
}

export interface AdminQnaAiSummaryPayload {
  qna_id: number;
  title: string;
  content: string;
  type: QnaType;
}

export interface AdminQnaAiSummaryResponse {
  summary: string;
  suggestedAnswer: string;
}

type QnaSummaryResponse = {
  id: number;
  type: QnaType;
  title: string;
  answered: boolean;
  createdAt?: string;
  created_at?: string;
};

type QnaDetailResponse = QnaSummaryResponse & {
  content: string;
  attachmentUrl?: string | null;
  attachment_url?: string | null;
  answerContent?: string | null;
  answer_content?: string | null;
  answeredAt?: string | null;
  answered_at?: string | null;
};

function mapQnaSummary(item: QnaSummaryResponse): QnaSummary {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    answered: item.answered,
    createdAt: item.createdAt ?? item.created_at ?? '',
  };
}

function mapQnaDetail(item: QnaDetailResponse): QnaDetail {
  return {
    ...mapQnaSummary(item),
    content: item.content,
    attachmentUrl: item.attachmentUrl ?? item.attachment_url ?? null,
    answerContent: item.answerContent ?? item.answer_content ?? null,
    answeredAt: item.answeredAt ?? item.answered_at ?? null,
  };
}

/** GET /cs/qna/list */
export async function apiGetMyQnas(token: string): Promise<QnaSummary[]> {
  const data = await request<QnaSummaryResponse[] | { items?: QnaSummaryResponse[] } | null>('/cs/qna/list', {}, token);
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? [];
  return list.map(mapQnaSummary);
}

/** GET /cs/qna/{id} */
export async function apiGetMyQna(token: string, id: number): Promise<QnaDetail> {
  const data = await request<QnaDetailResponse>(`/cs/qna/${id}`, {}, token);
  return mapQnaDetail(data);
}

/** POST /cs/qna */
export async function apiCreateMyQna(token: string, payload: QnaUpsertPayload): Promise<QnaDetail> {
  const data = await request<QnaDetailResponse>('/cs/qna', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapQnaDetail(data);
}

/** PATCH /cs/qna/{id} */
export async function apiUpdateMyQna(token: string, id: number, payload: QnaUpsertPayload): Promise<QnaDetail> {
  const data = await request<QnaDetailResponse>(`/cs/qna/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
  return mapQnaDetail(data);
}

/** DELETE /cs/qna/{id} */
export async function apiDeleteMyQna(token: string, id: number): Promise<null> {
  return request(`/cs/qna/${id}`, { method: 'DELETE' }, token);
}

/** GET /admin/cs/qna */
export async function apiGetAdminQnas(token: string): Promise<QnaDetail[]> {
  const data = await request<QnaDetailResponse[] | { items?: QnaDetailResponse[] } | null>('/admin/cs/qna', {}, token);
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? [];
  return list.map(mapQnaDetail).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** GET /admin/cs/qna/{id} */
export async function apiGetAdminQna(token: string, id: number): Promise<QnaDetail> {
  const data = await request<QnaDetailResponse>(`/admin/cs/qna/${id}`, {}, token);
  return mapQnaDetail(data);
}

/** POST /admin/cs/qna/{id}/answer */
export async function apiCreateAdminQnaAnswer(
  token: string,
  id: number,
  payload: QnaAnswerPayload
): Promise<QnaDetail> {
  const data = await request<QnaDetailResponse>(`/admin/cs/qna/${id}/answer`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapQnaDetail(data);
}

/** POST /admin/qna/{qna_id}/ai-summary */
export async function apiCreateAdminQnaAiSummary(
  _token: string,
  qnaId: number,
  payload: Omit<AdminQnaAiSummaryPayload, 'qna_id'>
): Promise<AdminQnaAiSummaryResponse> {
  const data = await chatbotRequest<{ summary: string; suggested_answer?: string; suggestedAnswer?: string }>(
    `/admin/qna/${qnaId}/ai-summary`,
    {
      method: 'POST',
      body: JSON.stringify({
        qna_id: qnaId,
        ...payload,
      }),
    }
  );

  return {
    summary: data.summary,
    suggestedAnswer: data.suggested_answer ?? data.suggestedAnswer ?? '',
  };
}

// ─── 관리자 쿠폰 ──────────────────────────────────────────────────────────────

export type AdminCouponDiscountType = 'FIXED' | 'PERCENT';
export type AdminCouponIssueType = 'EVENT' | 'SIGNIN';

export interface AdminCouponBoard {
  id: number;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  startAt: string;
  endAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCoupon {
  id: number;
  name: string;
  discountType: AdminCouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  validFrom: string;
  validUntil: string;
  totalQuantity: number;
  issuedQuantity: number;
  usedCount: number;
  issueType: AdminCouponIssueType;
  isActive: boolean;
  status?: 'ACTIVE' | 'EXPIRED' | 'STOPPED';
  couponBoardId: number | null;
  couponBoardTitle?: string | null;
}

export interface AdminCouponBoardPayload {
  title: string;
  content: string;
  thumbnailUrl?: string | null;
  isActive?: boolean | null;
  startAt: string;
  endAt?: string | null;
}

export interface AdminCouponCreatePayload {
  name: string;
  discountType: AdminCouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  validFrom: string;
  validUntil?: string | null;
  totalQuantity: number;
  issueType: AdminCouponIssueType;
  isActive?: boolean | null;
  couponBoardId?: number | null;
}

export interface AdminCouponUpdatePayload {
  name?: string;
  validUntil?: string | null;
  totalQuantity?: number | null;
}

type AdminCouponResponse = AdminCoupon & {
  discount_type?: AdminCouponDiscountType;
  discount_value?: number;
  min_order_price?: number;
  valid_from?: string;
  valid_until?: string;
  total_quantity?: number;
  issued_quantity?: number;
  usedCount?: number;
  used_count?: number;
  issue_type?: AdminCouponIssueType;
  is_active?: boolean;
  status?: 'ACTIVE' | 'EXPIRED' | 'STOPPED';
  coupon_board_id?: number | null;
  coupon_board_title?: string | null;
};

type AdminCouponBoardResponse = AdminCouponBoard & {
  thumbnail_url?: string | null;
  is_active?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  start_at?: string;
  end_at?: string;
  created_at?: string;
  updated_at?: string;
};

function listFromResponse<T>(
  data: T[] | { items?: T[]; content?: T[]; coupons?: T[]; boards?: T[] } | null
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.content ?? data.coupons ?? data.boards ?? [];
}

function mapAdminCoupon(item: AdminCouponResponse): AdminCoupon {
  return {
    id: item.id,
    name: item.name,
    discountType: item.discountType ?? item.discount_type ?? 'FIXED',
    discountValue: item.discountValue ?? item.discount_value ?? 0,
    minOrderPrice: item.minOrderPrice ?? item.min_order_price ?? 0,
    validFrom: item.validFrom ?? item.valid_from ?? '',
    validUntil: item.validUntil ?? item.valid_until ?? '',
    totalQuantity: item.totalQuantity ?? item.total_quantity ?? 0,
    issuedQuantity: item.issuedQuantity ?? item.issued_quantity ?? 0,
    usedCount: item.usedCount ?? item.used_count ?? 0,
    issueType: item.issueType ?? item.issue_type ?? 'EVENT',
    isActive: item.isActive ?? item.is_active ?? (item.status ? item.status !== 'STOPPED' : false),
    status: item.status,
    couponBoardId: item.couponBoardId ?? item.coupon_board_id ?? null,
    couponBoardTitle: item.couponBoardTitle ?? item.coupon_board_title ?? null,
  };
}

function mapAdminCouponBoard(item: AdminCouponBoardResponse): AdminCouponBoard {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    thumbnailUrl: item.thumbnailUrl ?? item.thumbnail_url ?? null,
    isActive: item.isActive ?? item.is_active ?? (item.status ? item.status === 'ACTIVE' : false),
    startAt: item.startAt ?? item.start_at ?? '',
    endAt: item.endAt ?? item.end_at ?? '',
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
}

/** GET /admin/coupon 👑 */
export async function apiGetAdminCoupons(token: string): Promise<AdminCoupon[]> {
  const data = await request<
    AdminCouponResponse[] | { items?: AdminCouponResponse[]; content?: AdminCouponResponse[]; coupons?: AdminCouponResponse[] } | null
  >('/admin/coupon', {}, token);
  return listFromResponse(data).map(mapAdminCoupon);
}

/** POST /admin/coupon 👑 */
export async function apiCreateAdminCoupon(
  token: string,
  payload: AdminCouponCreatePayload
): Promise<AdminCoupon> {
  const data = await request<AdminCouponResponse>('/admin/coupon', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminCoupon(data);
}

/** PUT /admin/coupon/{id} 👑 */
export async function apiUpdateAdminCoupon(
  token: string,
  id: number,
  payload: AdminCouponUpdatePayload
): Promise<AdminCoupon> {
  const data = await request<AdminCouponResponse>(`/admin/coupon/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminCoupon(data);
}

/** PATCH /admin/coupon/{id}/status 👑 */
export async function apiUpdateAdminCouponStatus(
  token: string,
  id: number,
  isActive: boolean
): Promise<AdminCoupon> {
  const data = await request<AdminCouponResponse>(`/admin/coupon/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  }, token);
  return mapAdminCoupon(data);
}

/** GET /admin/coupon-board 👑 */
export async function apiGetAdminCouponBoards(token: string): Promise<AdminCouponBoard[]> {
  const data = await request<
    AdminCouponBoardResponse[] | { items?: AdminCouponBoardResponse[]; content?: AdminCouponBoardResponse[]; boards?: AdminCouponBoardResponse[] } | null
  >('/admin/coupon-board', {}, token);
  return listFromResponse(data).map(mapAdminCouponBoard);
}

/** POST /admin/coupon-board 👑 */
export async function apiCreateAdminCouponBoard(
  token: string,
  payload: AdminCouponBoardPayload
): Promise<AdminCouponBoard> {
  const data = await request<AdminCouponBoardResponse>('/admin/coupon-board', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminCouponBoard(data);
}

/** PUT /admin/coupon-board/{id} 👑 */
export async function apiUpdateAdminCouponBoard(
  token: string,
  id: number,
  payload: AdminCouponBoardPayload
): Promise<AdminCouponBoard> {
  const data = await request<AdminCouponBoardResponse>(`/admin/coupon-board/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return mapAdminCouponBoard(data);
}

/** DELETE /admin/coupon-board/{id} 👑 */
export async function apiDeleteAdminCouponBoard(token: string, id: number): Promise<void> {
  await request<null>(`/admin/coupon-board/${id}`, { method: 'DELETE' }, token);
}

// ─── 배송비 정책 ──────────────────────────────────────────────────────────────

// ─── 관리자 카테고리 ───────────────────────────────────────────────────────────

export interface AdminCategory {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryPayload {
  name: string;
  sortOrder?: number;
}

export interface AdminCategoryOrderPayload {
  categoryOrders: {
    categoryId: number;
    sortOrder: number;
  }[];
}

/** GET /admin/category */
export async function apiGetAdminCategories(token: string): Promise<AdminCategory[]> {
  return request('/admin/category', {}, token);
}

/** POST /admin/category */
export async function apiCreateAdminCategory(
  token: string,
  payload: AdminCategoryPayload
): Promise<AdminCategory | string> {
  return request('/admin/category', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

/** PUT /admin/category/{id} */
export async function apiUpdateAdminCategory(
  token: string,
  id: number,
  payload: AdminCategoryPayload
): Promise<AdminCategory | string> {
  return request(`/admin/category/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

/** DELETE /admin/category/{id} */
export async function apiDeleteAdminCategory(token: string, id: number): Promise<string> {
  return request(`/admin/category/${id}`, { method: 'DELETE' }, token);
}

/** PATCH /admin/category/order */
export async function apiUpdateAdminCategoryOrder(
  token: string,
  payload: AdminCategoryOrderPayload
): Promise<null> {
  return request('/admin/category/order', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

export interface ShippingPolicy {
  baseFee: number;
  freeThreshold: number;
  updatedAt: string;
}

/** GET /admin/shipping-policy 👑 */
export async function apiGetShippingPolicy(token: string): Promise<ShippingPolicy> {
  return request('/admin/shipping-policy', {}, token);
}

/** PATCH /admin/shipping-policy 👑 */
export async function apiUpdateShippingPolicy(
  token: string,
  payload: { baseFee?: number; freeThreshold?: number }
): Promise<ShippingPolicy> {
  return request('/admin/shipping-policy', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}
export interface NoticeSummary {
  id: number;
  title: string;
  pinned: boolean;
  createdAt: string;
}

export interface NoticeDetail extends NoticeSummary {
  content: string;
}

export interface AdminNoticePayload {
  title: string;
  content: string;
  pinned: boolean;
}

export interface AdminNoticeCreatePayload extends AdminNoticePayload {}
export interface AdminNoticeUpdatePayload extends AdminNoticePayload {}

function mapNoticeSummary(item: NoticeSummaryResponse): NoticeSummary {
  return {
    id: item.id,
    title: item.title,
    pinned: item.pinned ?? item.is_pinned ?? false,
    createdAt: item.createdAt ?? item.created_at ?? '',
  };
}

function mapNoticeDetail(item: NoticeResponse): NoticeDetail {
  return {
    ...mapNoticeSummary(item),
    content: item.content,
  };
}

/** GET /cs/notice/list */
export async function apiGetPublicNotices(): Promise<NoticeSummary[]> {
  const data = await request<
    NoticeSummaryResponse[] | { items?: NoticeSummaryResponse[]; content?: NoticeSummaryResponse[]; notices?: NoticeSummaryResponse[] } | null
  >(
    '/cs/notice/list'
  );
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? data.content ?? data.notices ?? [];
  return list.map(mapNoticeSummary);
}

/** GET /cs/notice/{id} */
export async function apiGetPublicNotice(id: number): Promise<NoticeDetail> {
  const data = await request<NoticeResponse>(`/cs/notice/${id}`);
  return mapNoticeDetail(data);
}

/** GET /admin/cs/notice */
export async function apiGetAdminNotices(token: string): Promise<NoticeSummary[]> {
  const data = await request<
    NoticeSummaryResponse[] | { items?: NoticeSummaryResponse[]; content?: NoticeSummaryResponse[]; notices?: NoticeSummaryResponse[] } | null
  >(
    '/admin/cs/notice',
    {},
    token
  );
  const list = !data ? [] : Array.isArray(data) ? data : data.items ?? data.content ?? data.notices ?? [];
  return list.map(mapNoticeSummary);
}

/** GET /admin/cs/notice/{id} */
export async function apiGetAdminNotice(token: string, id: number): Promise<NoticeDetail> {
  const data = await request<NoticeResponse>(`/admin/cs/notice/${id}`, {}, token);
  return mapNoticeDetail(data);
}

/** POST /admin/cs/notice */
export async function apiCreateAdminNotice(
  token: string,
  payload: AdminNoticeCreatePayload
): Promise<NoticeDetail> {
  const data = await request<NoticeResponse>('/admin/cs/notice', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return mapNoticeDetail(data);
}

/** PUT /admin/cs/notice/{id} */
export async function apiUpdateAdminNotice(
  token: string,
  id: number,
  payload: AdminNoticeUpdatePayload
): Promise<NoticeDetail> {
  const data = await request<NoticeResponse>(`/admin/cs/notice/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return mapNoticeDetail(data);
}

/** DELETE /admin/cs/notice/{id} */
export async function apiDeleteAdminNotice(token: string, id: number): Promise<null> {
  return request(`/admin/cs/notice/${id}`, { method: 'DELETE' }, token);
}
