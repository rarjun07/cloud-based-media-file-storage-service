import { useQuery } from "@tanstack/react-query";

import { searchItems } from "../services/search";

export function useSearchItems(query: string, mimeType: string) {
  const normalizedQuery = query.trim();
  const normalizedMimeType = mimeType.trim();

  return useQuery({
    queryKey: ["search", normalizedQuery, normalizedMimeType],
    queryFn: () => searchItems(normalizedQuery, normalizedMimeType || undefined),
    enabled: Boolean(normalizedQuery || normalizedMimeType),
  });
}
