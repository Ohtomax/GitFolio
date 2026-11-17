import { z } from 'zod';

export const OAuthCallbackSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{1,512}$/),
  state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict();
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(), githubId: z.string().regex(/^\d+$/),
  login: z.string().regex(/^[a-zA-Z0-9-]{1,39}$/),
  name: z.string().nullable(), email: z.string().email().nullable(),
  avatarUrl: z.string().url().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;
export const AuthSessionSchema = z.object({ user: AuthUserSchema, expiresAt: z.number().int().positive() });
export type AuthSession = z.infer<typeof AuthSessionSchema>;
