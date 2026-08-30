import { api } from "./api";

export type SearchItem = {
  id: string;
  item_type: "file" | "folder";
  name: string;
  owner_id: string;
  folder_id: string | null;
  parent_id: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  updated_at: string;
};

export type SearchResponse = {
  query: string | null;
  mime_type: string | null;
  results: SearchItem[];
};

export async function searchItems(query: string, mimeType?: string): Promise<SearchResponse> {
  const response = await api.get<SearchResponse>("/search", {
    params: {
      q: query || undefined,
      mime_type: mimeType || undefined,
    },
  });
  return response.data;
}
