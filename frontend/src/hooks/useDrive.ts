import { useQuery } from "@tanstack/react-query";

import { getFolder, listDriveItems } from "../services/drive";
import type { BreadcrumbItem } from "../services/drive";

export function useDriveItems(folderId: string | null) {
  return useQuery({
    queryKey: ["drive-items", folderId],
    queryFn: () => listDriveItems(folderId),
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

export function buildBreadcrumbs(folderId: string | null, remoteBreadcrumbs?: BreadcrumbItem[]) {
  if (!folderId) {
    return [{ id: null, name: "My Drive" }] as const;
  }

  return [{ id: null, name: "My Drive" }, ...(remoteBreadcrumbs ?? [])];
}
