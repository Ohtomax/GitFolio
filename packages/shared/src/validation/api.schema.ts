import { z } from 'zod';

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const HealthResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.object({ status: z.literal('ok') }),
  }),
  z.object({
    success: z.literal(false),
    error: ApiErrorSchema,
  }),
]);

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
