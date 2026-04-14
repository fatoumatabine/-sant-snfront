const LOCAL_PROXY_API_BASE_URL = '/api/v1';

function normalizeBaseUrl(value: string | undefined): string {
  return (value || '').replace(/\/+$/, '');
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function shouldPreferProxyApiBaseUrl(configuredBaseUrl: string): boolean {
  if (typeof window === 'undefined' || !configuredBaseUrl || configuredBaseUrl.startsWith('/')) {
    return false;
  }

  try {
    const configuredUrl = new URL(configuredBaseUrl, window.location.origin);
    const currentProtocol = window.location.protocol;
    const currentHostname = window.location.hostname;

    if (currentProtocol === 'https:' && configuredUrl.protocol === 'http:') {
      return true;
    }

    if (!isLocalHostname(currentHostname) && isLocalHostname(configuredUrl.hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

const configuredApiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const DEFAULT_API_BASE_URL = shouldPreferProxyApiBaseUrl(configuredApiBaseUrl)
  ? LOCAL_PROXY_API_BASE_URL
  : normalizeBaseUrl(configuredApiBaseUrl || LOCAL_PROXY_API_BASE_URL);
const DEFAULT_API_TIMEOUT_MS = Math.max(
  5000,
  Number(import.meta.env.VITE_API_TIMEOUT_MS || 25000)
);

const API_TIMEOUT_MARKER = 'API_REQUEST_TIMEOUT';

export const API_BASE_URL = DEFAULT_API_BASE_URL;
export const API_PROXY_BASE_URL = LOCAL_PROXY_API_BASE_URL;
export const API_TIMEOUT_MS = DEFAULT_API_TIMEOUT_MS;

export function buildHealthUrl(baseUrl: string = API_BASE_URL): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  if (!normalizedBaseUrl) {
    return '/health';
  }

  if (normalizedBaseUrl.endsWith('/api/v1')) {
    return `${normalizedBaseUrl.slice(0, -'/api/v1'.length)}/health`;
  }

  return `${normalizedBaseUrl}/health`;
}

export function toApiNetworkError(error: unknown, url: string): Error {
  if (error instanceof Error && error.message === API_TIMEOUT_MARKER) {
    return new Error(
      `Le serveur met trop de temps a repondre (${url}). S'il est sur Render, il est peut-etre en train de demarrer. Reessayez dans quelques secondes.`
    );
  }

  if (error instanceof TypeError) {
    return new Error(
      `Impossible de contacter l'API (${url}). Verifiez VITE_API_URL, l'HTTPS et le CORS du backend.`
    );
  }

  return error instanceof Error ? error : new Error('Erreur reseau inattendue');
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(API_TIMEOUT_MARKER);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function warmUpApi(baseUrl: string = API_BASE_URL): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const healthUrl = buildHealthUrl(baseUrl);

  try {
    await fetchWithTimeout(
      healthUrl,
      {
        method: 'GET',
        cache: 'no-store',
      },
      Math.min(API_TIMEOUT_MS, 15000)
    );
  } catch (error) {
    console.info('[API Warmup]', { healthUrl, error });
  }
}
