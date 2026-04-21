import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { RunProgress, CreateRunRequest } from '@/types/api';

export function useRunProgress(runId: string | undefined, sinceId: number | null) {
  const params = sinceId ? `?sinceId=${sinceId}` : '';
  return useQuery({
    queryKey: ['run-progress', runId, sinceId],
    queryFn: () => apiFetch<RunProgress>(`/api/runs/${runId}/progress${params}`),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.run.status;
      if (!status) return 2000;
      if (status === 'queuing' || status === 'processing') return 2000;
      if (status === 'stopped') return 10000;
      return false; // Terminal — stop polling
    },
  });
}

export function useCreateRun(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: CreateRunRequest) =>
      apiFetch<{ run: any }>(`/api/lists/${listId}/runs`, {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });
}

export function useStopRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      apiFetch(`/api/runs/${runId}/stop`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['run-progress'] }),
  });
}

export function useResumeRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      apiFetch(`/api/runs/${runId}/resume`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['run-progress'] }),
  });
}

export function useRetryItems(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemIds?: string[]; filter?: { status: string } }) =>
      apiFetch(`/api/runs/${runId}/retry`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['run-progress'] }),
  });
}
