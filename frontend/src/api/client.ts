import axios, { AxiosError } from "axios";
import { env } from "@/lib/env";
import type { ApiErrorBody, TokenResponse } from "./types";

export const api = axios.create({ baseURL: env.API_URL, withCredentials: true, timeout: 15000 });

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

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<TokenResponse> | null = null;

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
        window.dispatchEvent(new Event("session-expired"));
      }
    }
    throw toApiError(err);
  },
);
