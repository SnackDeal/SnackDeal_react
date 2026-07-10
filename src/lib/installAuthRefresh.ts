import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useAuthStore } from '@/stores/authStore';

const configuredBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
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
    return '';
  }

  return configuredBaseUrl.replace(/\/$/, '');
})();

const REFRESH_PATH = '/member/token/refresh';

declare global {
  interface Window {
    __snackdealAuthRefreshInstalled__?: boolean;
  }
}

function getBearerToken(headers: Headers): string | null {
  const authorization = headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length);
}

async function refreshAccessToken(
  originalFetch: typeof window.fetch,
  expiredToken: string
): Promise<string | null> {
  const userStore = useAuthStore.getState();
  if (userStore.accessToken === expiredToken && userStore.refreshToken) {
    try {
      const response = await originalFetch(`${BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: userStore.refreshToken }),
      });
      const body = await response.json().catch(() => ({}));
      const tokens = Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;

      if (!response.ok || body.success === false || !tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error('Refresh failed');
      }

      useAuthStore.setState({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return tokens.accessToken;
    } catch {
      userStore.logout();
      return null;
    }
  }

  const adminStore = useAdminAuthStore.getState();
  if (adminStore.accessToken === expiredToken && adminStore.refreshToken) {
    try {
      const response = await originalFetch(`${BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: adminStore.refreshToken }),
      });
      const body = await response.json().catch(() => ({}));
      const tokens = Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;

      if (!response.ok || body.success === false || !tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error('Refresh failed');
      }

      useAdminAuthStore.setState({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return tokens.accessToken;
    } catch {
      adminStore.adminLogout();
      return null;
    }
  }

  return null;
}

if (typeof window !== 'undefined' && !window.__snackdealAuthRefreshInstalled__) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.includes(REFRESH_PATH)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has('Authorization') && input instanceof Request) {
      const requestToken = getBearerToken(input.headers);
      if (requestToken) headers.set('Authorization', `Bearer ${requestToken}`);
    }

    const token = getBearerToken(headers);
    const response = await originalFetch(input, init);

    if (!token || response.status !== 401) {
      return response;
    }

    const refreshedToken = await refreshAccessToken(originalFetch, token);
    if (!refreshedToken) {
      return response;
    }

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

    if (typeof input === 'string' || input instanceof URL) {
      return originalFetch(input, { ...init, headers: retryHeaders });
    }

    return originalFetch(new Request(input, { headers: retryHeaders }));
  };

  window.__snackdealAuthRefreshInstalled__ = true;
}
