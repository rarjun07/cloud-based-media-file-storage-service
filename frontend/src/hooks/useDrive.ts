import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFolder,
  deleteFile,
  deleteFolder,
  getFileDownload,
  getFolder,
  listActivities,
  listAllFolders,
  listDriveItems,
  listFileVersions,
  listSharedItems,
  listStarredItems,
  starItem,
  unstarItem,
  updateFile,
  updateFolder,
} from "../services/drive";
import type { BreadcrumbItem } from "../services/drive";

export function useDriveItems(folderId: string | null) {
  return useQuery({
    queryKey: ["drive-items", folderId],
    queryFn: () => listDriveItems(folderId),
  });
}

export function useAllFolders(enabled: boolean) {
  return useQuery({
    queryKey: ["all-folders"],
    queryFn: listAllFolders,
    enabled,
  });
}

export function useFolderDetail(folderId: string | null) {
  return useQuery({
    queryKey: ["folder-detail", folderId],
    queryFn: () => {
      if (!folderId) {
        throw new Error("Folder ID is required");
      }
      return getFolder(folderId);
    },
    enabled: Boolean(folderId),
  });
}

export function useSharedItems(enabled: boolean) {
  return useQuery({
    queryKey: ["shared-items"],
    queryFn: listSharedItems,
    enabled,
  });
}

export function useStarredItems(enabled: boolean) {
  return useQuery({
    queryKey: ["starred-items"],
    queryFn: listStarredItems,
    enabled,
  });
}

export function useCreateFolder(parentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createFolder(name, parentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["drive-items", parentId] });
      void queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, folder_id }: { id: string; name?: string; folder_id?: string | null }) =>
      updateFile(id, { name, folder_id }),
    onSuccess: () => invalidateDriveQueries(queryClient),
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, parent_id }: { id: string; name?: string; parent_id?: string | null }) =>
      updateFolder(id, { name, parent_id }),
    onSuccess: () => invalidateDriveQueries(queryClient),
  });
}

export function useDeleteDriveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }: { type: "file" | "folder"; id: string }) =>
      type === "file" ? deleteFile(id) : deleteFolder(id),
    onSuccess: () => invalidateDriveQueries(queryClient),
  });
}

export function useFileDownload() {
  return useMutation({
    mutationFn: getFileDownload,
  });
}

export function useFileVersions(fileId: string | null) {
  return useQuery({
    queryKey: ["file-versions", fileId],
    queryFn: () => {
      if (!fileId) {
        throw new Error("File ID is required");
      }
      return listFileVersions(fileId);
    },
    enabled: Boolean(fileId),
  });
}

export function useActivities(enabled: boolean) {
  return useQuery({
    queryKey: ["activities"],
    queryFn: listActivities,
    enabled,
  });
}

export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, starred }: { type: "file" | "folder"; id: string; starred: boolean }) =>
      starred ? unstarItem(type, id) : starItem(type, id),
    onSuccess: () => invalidateDriveQueries(queryClient),
  });
}

export function buildBreadcrumbs(folderId: string | null, remoteBreadcrumbs?: BreadcrumbItem[]) {
  if (!folderId) {
    return [{ id: null, name: "My Drive" }] as const;
  }

  return [{ id: null, name: "My Drive" }, ...(remoteBreadcrumbs ?? [])];
}

function invalidateDriveQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["drive-items"] });
  void queryClient.invalidateQueries({ queryKey: ["shared-items"] });
  void queryClient.invalidateQueries({ queryKey: ["starred-items"] });
  void queryClient.invalidateQueries({ queryKey: ["trash"] });
  void queryClient.invalidateQueries({ queryKey: ["search"] });
  void queryClient.invalidateQueries({ queryKey: ["all-folders"] });
  void queryClient.invalidateQueries({ queryKey: ["activities"] });
}
