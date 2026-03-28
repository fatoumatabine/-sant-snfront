// Core API Client - Re-exports from services for domain use
export { apiService } from '@/services/api';

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
