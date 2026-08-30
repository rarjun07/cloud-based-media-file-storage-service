import { api } from "./api";

export type Folder = {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  is_deleted: boolean;
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
};

export type DriveItems = {
  folders: Folder[];
  files: FileItem[];
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
