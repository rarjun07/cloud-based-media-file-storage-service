import { api } from "./api";

export type Folder = {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BreadcrumbItem = {
  id: string;
  name: string;
};

export type FolderDetail = Folder & {
  breadcrumbs: BreadcrumbItem[];
};

export type FileItem = {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_provider: string;
  storage_bucket: string;
  storage_key: string;
  checksum: string | null;
  upload_status: string;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DriveItems = {
  folders: Folder[];
  files: FileItem[];
};

export type StarredItems = DriveItems;

export type FileDownload = {
  file_id: string;
  download_url: string;
  expires_in_seconds: number;
};

export type InitUploadPayload = {
  name: string;
  mime_type: string;
  size_bytes: number;
  folder_id: string | null;
};

export type InitUploadResponse = {
  file_id: string;
  storage_provider: string;
  storage_bucket: string;
  storage_key: string;
  upload_url: string;
  upload_token: string;
  expires_in_seconds: number;
};

export async function listFolders(parentId: string | null): Promise<Folder[]> {
  const response = await api.get<Folder[]>("/folders", {
    params: parentId ? { parent_id: parentId } : undefined,
  });
  return response.data;
}

export async function listAllFolders(): Promise<Folder[]> {
  const response = await api.get<Folder[]>("/folders", {
    params: { recursive: true },
  });
  return response.data;
}

export async function getFolder(folderId: string): Promise<FolderDetail> {
  const response = await api.get<FolderDetail>(`/folders/${folderId}`);
  return response.data;
}

export async function listFiles(folderId: string | null): Promise<FileItem[]> {
  const response = await api.get<FileItem[]>("/files", {
    params: folderId ? { folder_id: folderId } : undefined,
  });
  return response.data;
}

export async function listDriveItems(folderId: string | null): Promise<DriveItems> {
  const [folders, files] = await Promise.all([listFolders(folderId), listFiles(folderId)]);
  return { folders, files };
}

export async function listSharedItems(): Promise<DriveItems> {
  const response = await api.get<DriveItems>("/shared-with-me");
  return response.data;
}

export async function listStarredItems(): Promise<StarredItems> {
  const response = await api.get<StarredItems>("/stars");
  return response.data;
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const response = await api.post<Folder>("/folders", { name, parent_id: parentId });
  return response.data;
}

export async function updateFolder(folderId: string, payload: { name?: string; parent_id?: string | null }): Promise<Folder> {
  const response = await api.patch<Folder>(`/folders/${folderId}`, payload);
  return response.data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  await api.delete(`/folders/${folderId}`);
}

export async function updateFile(fileId: string, payload: { name?: string; folder_id?: string | null }): Promise<FileItem> {
  const response = await api.patch<FileItem>(`/files/${fileId}`, payload);
  return response.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}

export async function getFileDownload(fileId: string): Promise<FileDownload> {
  const response = await api.get<FileDownload>(`/files/${fileId}/download-url`);
  return response.data;
}

export type FileVersion = {
  id: string;
  file_id: string;
  created_by: string;
  version_number: number;
  storage_key: string;
  size_bytes: number;
  checksum: string | null;
  created_at: string;
};

export async function listFileVersions(fileId: string): Promise<FileVersion[]> {
  const response = await api.get<FileVersion[]>(`/files/${fileId}/versions`);
  return response.data;
}

export type Activity = {
  id: string;
  user_id: string;
  action: string;
  file_id: string | null;
  folder_id: string | null;
  created_at: string;
};

export async function listActivities(): Promise<Activity[]> {
  const response = await api.get<Activity[]>("/activities");
  return response.data;
}

export async function starItem(type: "file" | "folder", id: string): Promise<void> {
  await api.post(`/stars/${type}s/${id}`);
}

export async function unstarItem(type: "file" | "folder", id: string): Promise<void> {
  await api.delete(`/stars/${type}s/${id}`);
}

export async function initUpload(payload: InitUploadPayload): Promise<InitUploadResponse> {
  const response = await api.post<InitUploadResponse>("/files/init-upload", payload);
  return response.data;
}

export async function uploadToSignedUrl(
  uploadUrl: string,
  file: globalThis.File,
  onProgress: (progress: number) => void,
): Promise<void> {
  await api.put(uploadUrl, file, {
    baseURL: "",
    withCredentials: false,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    onUploadProgress: (event) => {
      if (!event.total) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
}

export async function completeUpload(fileId: string): Promise<FileItem> {
  const response = await api.post<FileItem>("/files/complete-upload", { file_id: fileId });
  return response.data;
}
