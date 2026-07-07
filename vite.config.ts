import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const BACKEND = process.env.VITE_PROXY_TARGET ?? 'https://snackdeal.mite88.site';

/**
 * 백엔드 API 경로(`/admin`, `/member` 등)가 프론트 화면 경로(`/admin/login` 등)와 겹친다.
 * 브라우저가 페이지를 직접 열거나 새로고침하면 그 HTML 문서 요청까지 프록시로 새어나가
 * 백엔드가 401/403/500 을 돌려주는 문제가 있다.
 * → HTML 내비게이션(Accept: text/html)은 SPA(index.html)가 처리하도록 bypass 하고,
 *   앱의 fetch(JSON) 호출만 백엔드로 보낸다.
 */
function apiProxy(): ProxyOptions {
  return {
    target: BACKEND,
    changeOrigin: true,
    bypass(req) {
      if (req.headers.accept?.includes('text/html')) return '/index.html';
    },
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/member': apiProxy(),
      '/admin': apiProxy(),
      '/order': apiProxy(),
      '/chatbot': apiProxy(),
      '/health': apiProxy(),
      // 구글 OAuth2: 진입(/oauth2/authorization/google) + 콜백(/login/oauth2/code/google)
      // 이건 실제 리다이렉트/폼 흐름이라 bypass 없이 그대로 백엔드로 넘긴다.
      '/oauth2/authorization': BACKEND,
      '/login/oauth2': BACKEND,
    },
  },
});
