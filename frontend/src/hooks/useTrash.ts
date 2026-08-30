import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listTrash, permanentlyDeleteTrashItem, restoreTrashItem } from "../services/trash";
import type { TrashTarget } from "../services/trash";

export function useTrash() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: listTrash,
  });
}

export function useRestoreTrashItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreTrashItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trash"] });
      void queryClient.invalidateQueries({ queryKey: ["drive-items"] });
      void queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function usePermanentDeleteTrashItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: TrashTarget) => permanentlyDeleteTrashItem(target),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trash"] });
      void queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}
