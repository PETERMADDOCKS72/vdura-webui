import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function usePerformance() {
  return useQuery({
    queryKey: ['performance'],
    queryFn: api.performance.summary,
    refetchInterval: 30_000,
  });
}
