import { ApiError } from '../services/api.ts';

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
