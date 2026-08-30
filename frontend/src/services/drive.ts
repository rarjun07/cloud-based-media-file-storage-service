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
