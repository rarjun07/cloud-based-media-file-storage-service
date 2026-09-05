import { api, clearStoredAuthTokens, getApiBaseUrl, storeAuthTokens } from "./api";

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  email?: string;
  full_name?: string | null;
  profile_image_url?: string | null;
};

type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const response = await api.post<User>("/auth/register", payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<void> {
  const response = await api.post<TokenPair>("/auth/login", payload);
  storeAuthTokens(response.data);
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await api.patch<User>("/auth/me", payload);
  return response.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearStoredAuthTokens();
  }
}

export function getGoogleLoginUrl() {
  return `${getApiBaseUrl().replace(/\/$/, "")}/auth/google/login`;
}
