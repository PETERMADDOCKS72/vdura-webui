export const API_BASE = '/api/v1';

export const API_ROUTES = {
  VOLUMES: `${API_BASE}/volumes`,
  POOLS: `${API_BASE}/pools`,
  HOSTS: `${API_BASE}/hosts`,
  ALERTS: `${API_BASE}/alerts`,
  PERFORMANCE: `${API_BASE}/performance`,
  SYSTEM: `${API_BASE}/system`,
} as const;

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
