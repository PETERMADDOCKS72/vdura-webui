import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useSystem() {
  return useQuery({ queryKey: ['system'], queryFn: api.system.info });
}
