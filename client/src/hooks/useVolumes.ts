import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateVolumeRequest } from '@vdura/shared';
import { api } from '@/api/client';

export function useVolumes() {
  return useQuery({ queryKey: ['volumes'], queryFn: api.volumes.list });
}

export function useVolume(id: string) {
  return useQuery({ queryKey: ['volumes', id], queryFn: () => api.volumes.get(id) });
}

export function useCreateVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVolumeRequest) => api.volumes.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volumes'] }),
  });
}

export function useDeleteVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.volumes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volumes'] }),
  });
}
