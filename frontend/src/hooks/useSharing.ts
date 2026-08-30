import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPublicLink,
  createShare,
  deleteShare,
  listShares,
  type ShareRole,
  type ShareTarget,
} from "../services/sharing";

export function useShares(target: ShareTarget | null) {
  return useQuery({
    queryKey: ["shares", target?.type, target?.id],
    queryFn: () => {
      if (!target) {
        throw new Error("Share target is required");
      }
      return listShares(target);
    },
    enabled: Boolean(target),
  });
}

export function useCreateShare(target: ShareTarget | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { shared_with_email: string; role: ShareRole }) => {
      if (!target) {
        throw new Error("Share target is required");
      }
      return createShare(target, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shares", target?.type, target?.id] });
    },
  });
}

export function useDeleteShare(target: ShareTarget | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShare,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shares", target?.type, target?.id] });
    },
  });
}

export function useCreatePublicLink(target: ShareTarget | null) {
  return useMutation({
    mutationFn: (payload: { role: ShareRole; expires_at?: string; password?: string }) => {
      if (!target) {
        throw new Error("Share target is required");
      }
      return createPublicLink(target, payload);
    },
  });
}
