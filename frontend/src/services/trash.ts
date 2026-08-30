import { api } from "./api";
import type { FileItem, Folder } from "./drive";

export type TrashResponse = {
  files: FileItem[];
  folders: Folder[];
};

export type TrashTarget = {
  id: string;
  type: "file" | "folder";
};

export async function listTrash(): Promise<TrashResponse> {
  const response = await api.get<TrashResponse>("/trash");
  return response.data;
}

export async function restoreTrashItem(target: TrashTarget): Promise<FileItem | Folder> {
  const response = await api.post<FileItem | Folder>(`/trash/${target.type}s/${target.id}/restore`);
  return response.data;
}

export async function permanentlyDeleteTrashItem(target: TrashTarget): Promise<void> {
  await api.delete(`/trash/${target.type}s/${target.id}`);
}
