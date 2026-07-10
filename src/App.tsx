import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserLayout, AdminLayout } from '@/components/layout';
import { ToastViewport } from '@/components/ui';

// 사용자 페이지
import { Home } from '@/pages/user/Home';
import LoginPage from '@/pages/user/LoginPage';
import SignupPage from '@/pages/user/SignupPage';
import SignupCompletePage from '@/pages/user/SignupCompletePage';
import OAuthCallback from '@/pages/user/OAuthCallback';
import ProductListPage from '@/pages/user/ProductListPage';
import ProductDetailPage from '@/pages/user/ProductDetailPage';
import CartPage from '@/pages/user/CartPage';
import CheckoutPage from '@/pages/user/CheckoutPage';
import MyPage from '@/pages/user/MyPage';
import { OrderList } from '@/pages/user/OrderList';
import { OrderDetail } from '@/pages/user/OrderDetail';
import OrderCompletePage from '@/pages/user/OrderCompletePage';
import CouponBoxPage from '@/pages/user/CouponBox';
import DeliveryBookPage from '@/pages/user/DeliveryBookPage';
import EventList from '@/pages/user/EventList';
import { EventDetail } from '@/pages/user/EventDetail';
import NoticeListPage from '@/pages/user/Notice';
import NoticeDetailPage from '@/pages/user/NoticeDetailPage';
import QnaListPage from '@/pages/user/QnaList';
import QnaDetailPage from '@/pages/user/QnaDetailPage';
import { QnaNew } from '@/pages/user/QnaNew';

// 관리자 페이지
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminProductsPage from '@/pages/admin/AdminProducts';
import { AdminProductNew } from '@/pages/admin/AdminProductNew';
import { AdminProductEdit } from '@/pages/admin/AdminProductEdit';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import AdminOrdersPage from '@/pages/admin/AdminOrders';
import { AdminOrderDetail } from '@/pages/admin/AdminOrderDetail';
import AdminCouponsPage from '@/pages/admin/AdminCoupons';
import { AdminCouponBoards } from '@/pages/admin/AdminCouponBoards';
import AdminMembersPage from '@/pages/admin/AdminMembers';
import { AdminMemberDetail } from '@/pages/admin/AdminMemberDetail';
import AdminNoticeListPage from '@/pages/admin/AdminNoticeList';
import AdminNoticeDetailPage from '@/pages/admin/AdminNoticeDetailPage';
import AdminNoticeFormPage from '@/pages/admin/AdminNoticeFormPage';
import AdminQnaListPage from '@/pages/admin/AdminQnaList';
import AdminQnaDetailPage from '@/pages/admin/AdminQnaDetailPage';
import AdminFaqPage from '@/pages/admin/AdminFaq';

import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* 인증 (레이아웃 없음) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/complete" element={<SignupCompletePage />} />
        <Route path="/oauth2/callback" element={<OAuthCallback />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* 사용자 */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<ProductListPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/complete" element={<OrderCompletePage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/orders" element={<OrderList />} />
          <Route path="/mypage/orders/:id" element={<OrderDetail />} />
          <Route path="/mypage/coupons" element={<CouponBoxPage />} />
          <Route path="/mypage/delivery" element={<DeliveryBookPage />} />
          <Route path="/event" element={<EventList />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/cs/notice" element={<NoticeListPage />} />
          <Route path="/cs/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/cs/qna" element={<QnaListPage />} />
          <Route path="/cs/qna/:id" element={<QnaDetailPage />} />
          <Route path="/cs/qna/new" element={<QnaNew />} />
        </Route>

        {/* 관리자 */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/new" element={<AdminProductNew />} />
          <Route path="/admin/products/:id" element={<AdminProductEdit />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/coupons/boards" element={<AdminCouponBoards />} />
          <Route path="/admin/coupon-boards" element={<AdminCouponBoards />} />
          <Route path="/admin/members" element={<AdminMembersPage />} />
          <Route path="/admin/members/:id" element={<AdminMemberDetail />} />
          <Route path="/admin/cs/notices" element={<AdminNoticeListPage />} />
          <Route path="/admin/cs/notices/new" element={<AdminNoticeFormPage />} />
          <Route path="/admin/cs/notices/:id" element={<AdminNoticeDetailPage />} />
          <Route path="/admin/cs/notices/:id/edit" element={<AdminNoticeFormPage />} />
          <Route path="/admin/cs/faq" element={<AdminFaqPage />} />
          <Route path="/admin/cs/qna" element={<AdminQnaListPage />} />
          <Route path="/admin/cs/qna/:id" element={<AdminQnaDetailPage />} />
          <Route path="/admin/qna" element={<AdminQnaListPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastViewport />
    </BrowserRouter>
  );
}
