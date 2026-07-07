/**
 * API 클라이언트 — 백엔드 연동용.
 * 백엔드 미기동 시 mock 데이터로 fallback.
 * 모든 응답은 CommonResponse<T> { success, code, message, data } 래퍼.
 */

// VITE_API_URL 이 설정되면 해당 주소로, 비어있으면 Vite 프록시(상대경로) 사용
import { formatPhoneNumberForStorage } from '@/lib/phone';
import type { Product } from '@/lib/mockProducts';

const configuredBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
const configuredChatbotBaseUrl = ((import.meta.env.VITE_CHATBOT_API_URL as string | undefined) ?? '').trim();
const PRODUCTION_API_URL = 'https://snackdeal.mite88.site';

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

/** GET /admin/main 👑 */
export async function apiGetDashboard(token: string): Promise<DashboardData> {
  return request('/admin/main', {}, token);
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
  couponName: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  minOrderPrice: number;
  validUntil: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
}

/** GET /mypage/coupon 🔒 */
export async function apiGetMyCoupons(token: string): Promise<MyCoupon[]> {
  const data = await request<MyCoupon[] | { coupons?: MyCoupon[] } | null>('/mypage/coupon', {}, token);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.coupons ?? [];
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
  userCouponId?: number;
}

export interface OrderPrepareResponse {
  paymentId: string;
  amount: number;
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
): Promise<string> {
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
