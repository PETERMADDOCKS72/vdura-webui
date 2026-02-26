import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function usePools() {
  return useQuery({ queryKey: ['pools'], queryFn: api.pools.list });
}

export function usePool(id: string) {
  return useQuery({ queryKey: ['pools', id], queryFn: () => api.pools.get(id) });
}
