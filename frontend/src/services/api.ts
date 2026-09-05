import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

const AUTH_TOKEN_STORAGE_KEY = "cloud-drive-access-token";
const REFRESH_TOKEN_STORAGE_KEY = "cloud-drive-refresh-token";
export const AUTH_REQUIRED_EVENT = "cloud-drive-auth-required";

type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const response = await axios.post<TokenPair>(
            `${getApiBaseUrl().replace(/\/$/, "")}/auth/refresh`,
            { refresh_token: refreshToken },
            { withCredentials: true },
          );
          storeAuthTokens(response.data);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${response.data.access_token}`,
          };
          return api(originalRequest);
        } catch {
          clearStoredAuthTokens({ notify: true });
        }
      } else {
        clearStoredAuthTokens({ notify: true });
      }
    }
    return Promise.reject(error);
  },
);

export function getApiBaseUrl() {
  return api.defaults.baseURL ?? "http://127.0.0.1:8000/api/v1";
}

export function storeAuthTokens(tokenPair: TokenPair) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, tokenPair.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokenPair.refresh_token);
}

export function clearStoredAuthTokens(options?: { notify?: boolean }) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  if (options?.notify) {
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "CloudDrive cannot reach the API right now. Refresh the page and try again.";
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0];
      if (typeof firstError?.msg === "string") {
        return firstError.msg;
      }
    }
    return error.message;
  }

  return "Something went wrong";
}

export function isApiConnectionError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
