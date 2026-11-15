import type { ApiError } from '../validation/api.schema.js';

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };
