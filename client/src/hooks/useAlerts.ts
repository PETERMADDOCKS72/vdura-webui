import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useAlerts(filters?: { severity?: string; status?: string }) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => api.alerts.list(filters),
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.alerts.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
