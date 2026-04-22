import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { PaginatedResponse, ListSummary, ListDetail } from '@/types/api';

export function useLists(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['lists', page, pageSize],
    queryFn: () =>
      apiFetch<PaginatedResponse<ListSummary>>(
        `/api/lists?page=${page}&pageSize=${pageSize}`
      ),
  });
}

export function useListDetail(listId: string | undefined) {
  return useQuery({
    queryKey: ['list', listId],
    queryFn: () => apiFetch<ListDetail>(`/api/lists/${listId}`),
    enabled: !!listId,
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) =>
      apiFetch(`/api/lists/${listId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUploadCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<{
        listId: string;
        headers: string[];
        delimiter: string;
        encoding: string;
        preview: string[][];
      }>('/api/lists', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useConfirmMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, mapping }: { listId: string; mapping: unknown }) =>
      apiFetch(`/api/lists/${listId}/column-mapping`, {
        method: 'POST',
        body: JSON.stringify(mapping),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useContacts(
  listId: string | undefined,
  page = 1,
  pageSize = 50,
  search?: string,
  status?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('q', search);
  if (status) params.set('status', status);

  return useQuery({
    queryKey: ['contacts', listId, page, pageSize, search, status],
    queryFn: () =>
      apiFetch<PaginatedResponse<import('@/types/api').ContactRow>>(
        `/api/lists/${listId}/contacts?${params}`
      ),
    enabled: !!listId,
  });
}
