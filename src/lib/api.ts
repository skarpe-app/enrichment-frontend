import { supabase } from './supabase';
import type { ApiError } from '@/types/api';

/**
 * API base URL. In dev, Vite proxies /api to localhost:3001.
 * In production (separate deployment), set VITE_API_URL to the backend URL.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Fetch wrapper that attaches JWT and handles 401 refresh flow per §6a.
 *
 * 1. Attaches Authorization: Bearer <access_token> from current session.
 * 2. On 401: refreshes the session once and retries the request.
 * 3. If refresh fails or second attempt also 401s: redirects to /login.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(path, options);

  // On 401, try refreshing the session once
  if (response.status === 401) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      // Refresh failed — force logout
      await forceLogout();
      throw new ApiClientError('Session expired', 'unauthenticated', 401);
    }

    // Retry with new token
    const retryResponse = await fetchWithAuth(path, options);
    if (retryResponse.status === 401) {
      await forceLogout();
      throw new ApiClientError('Session expired', 'unauthenticated', 401);
    }
    return handleResponse<T>(retryResponse);
  }

  return handleResponse<T>(response);
}

async function fetchWithAuth(path: string, options: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  // Only set Content-Type when we actually have a body to send.
  // Empty POSTs (e.g. /resume, /stop, /test) must NOT set JSON content-type —
  // Fastify rejects empty JSON bodies with 400.
  if (
    !headers.has('Content-Type') &&
    options.body != null &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = await response.json();
    } catch {
      // Non-JSON error response
    }
    throw new ApiClientError(
      errorBody?.error?.message ?? `HTTP ${response.status}`,
      errorBody?.error?.code ?? 'unknown',
      response.status,
      errorBody?.error?.details
    );
  }
  return response.json();
}

async function forceLogout() {
  // Clear React Query cache before redirect to avoid stale data flashes
  const { queryClient } = await import('../main');
  queryClient.clear();
  await supabase.auth.signOut();
  window.location.href = '/login';
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
