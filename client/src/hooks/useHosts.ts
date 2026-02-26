import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useHosts() {
  return useQuery({ queryKey: ['hosts'], queryFn: api.hosts.list });
}

export function useHost(id: string) {
  return useQuery({ queryKey: ['hosts', id], queryFn: () => api.hosts.get(id) });
}
