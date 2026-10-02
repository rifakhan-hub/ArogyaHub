import axios, { AxiosError } from "axios";
import { env } from "@/lib/env";
import type { ApiErrorBody, TokenResponse } from "./types";

/** The HTTP client for the backend. Every request goes through here. */
export const api = axios.create({ baseURL: env.API_URL, withCredentials: true, timeout: 15000 });

/** Any failed request becomes an ApiError with the backend's message and request ID. */
export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(code: string, message: string, status = 0, requestId?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

/** Turns an axios error into an ApiError. The backend sends { error: { code, message, request_id } }. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof AxiosError) {
    if (!err.response) return new ApiError("NETWORK_ERROR", "We couldn't reach the server. Check your connection and try again.");
    const body = err.response.data as Partial<ApiErrorBody> | undefined;
    return new ApiError(
      body?.error?.code ?? `HTTP_${err.response.status}`,
      body?.error?.message ?? "Something unexpected happened on the server. Try again.",
      err.response.status,
      body?.error?.request_id,
    );
  }
  return new ApiError("UNKNOWN", err instanceof Error ? err.message : "Something unexpected happened.");
}

// The access token is kept in memory only. The refresh token is an HttpOnly cookie the browser sends for us.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// If many requests fail with 401 at the same time, they all wait for this one refresh.
let refreshing: Promise<TokenResponse> | null = null;

/** Swaps the refresh cookie for a new access token. Also used on page load to restore the session. */
export function refreshAccessToken(): Promise<TokenResponse> {
  refreshing ??= axios
    .post<TokenResponse>(`${env.API_URL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      setAccessToken(res.data.access_token);
      return res.data;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

// On a 401: refresh the token once and retry. If the refresh fails too, the session is over.
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const request = err.config;
    const isAuthCall = request?.url?.startsWith("/auth/");
    if (err.response?.status === 401 && request && !request._retried && !isAuthCall) {
      request._retried = true;
      try {
        await refreshAccessToken();
        return api(request);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event("session-expired")); // AuthContext listens and signs out
      }
    }
    throw toApiError(err);
  },
);
