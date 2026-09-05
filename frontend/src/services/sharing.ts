import { api } from "./api";

export type ShareRole = "viewer" | "editor";
export type ShareTargetType = "file" | "folder";

export type ShareTarget = {
  id: string;
  type: ShareTargetType;
  name: string;
};

export type Share = {
  id: string;
  owner_id: string;
  shared_with_user_id: string;
  shared_with_email: string | null;
  file_id: string | null;
  folder_id: string | null;
  role: ShareRole;
  created_at: string;
  updated_at: string;
};

export type CreateSharePayload = {
  shared_with_email: string;
  role: ShareRole;
  file_id?: string;
  folder_id?: string;
};

export type CreatePublicLinkPayload = {
  role: ShareRole;
  file_id?: string;
  folder_id?: string;
  expires_at?: string;
  password?: string;
};

export type PublicLinkResponse = {
  id: string;
  token: string;
  public_path: string;
  role: ShareRole;
  file_id: string | null;
  folder_id: string | null;
  expires_at: string | null;
};

export type PublicLinkAccessResponse = {
  id: string;
  role: ShareRole;
  file_id: string | null;
  folder_id: string | null;
  expires_at: string | null;
  file: {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    updated_at: string;
  } | null;
  folder: {
    id: string;
    name: string;
    updated_at: string;
  } | null;
  files: {
    file: {
      id: string;
      name: string;
      mime_type: string;
      size_bytes: number;
      updated_at: string;
    };
    download: {
      file_id: string;
      download_url: string;
      expires_in_seconds: number;
    };
  }[];
  folders: {
    id: string;
    name: string;
    updated_at: string;
  }[];
  download: {
    file_id: string;
    download_url: string;
    expires_in_seconds: number;
  } | null;
};

export function targetToPayload(target: ShareTarget) {
  return target.type === "file" ? { file_id: target.id } : { folder_id: target.id };
}

export async function listShares(target: ShareTarget): Promise<Share[]> {
  const response = await api.get<Share[]>("/shares", {
    params: targetToPayload(target),
  });
  return response.data;
}

export async function createShare(target: ShareTarget, payload: Omit<CreateSharePayload, "file_id" | "folder_id">) {
  const response = await api.post<Share>("/shares", {
    ...targetToPayload(target),
    ...payload,
  });
  return response.data;
}

export async function deleteShare(shareId: string): Promise<void> {
  await api.delete(`/shares/${shareId}`);
}

export async function createPublicLink(
  target: ShareTarget,
  payload: Omit<CreatePublicLinkPayload, "file_id" | "folder_id">,
) {
  const response = await api.post<PublicLinkResponse>("/public-link", {
    ...targetToPayload(target),
    ...payload,
  });
  return response.data;
}

export async function accessPublicLink(token: string, password?: string): Promise<PublicLinkAccessResponse> {
  const response = await api.post<PublicLinkAccessResponse>(`/public-link/${token}`, {
    password: password || undefined,
  });
  return response.data;
}

export function buildPublicLinkUrl(publicPath: string) {
  const parts = publicPath.split("/").filter(Boolean);
  const token = parts[parts.length - 1] ?? publicPath;
  return new URL(`/public-link/${token}`, window.location.origin).toString();
}
