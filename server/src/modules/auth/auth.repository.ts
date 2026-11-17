import type { Prisma, PrismaClient } from '@prisma/client';

export const profileSelect = {
  id: true, githubId: true, login: true, name: true, email: true, avatarUrl: true,
} satisfies Prisma.UserSelect;
const credentialSelect = {
  ...profileSelect, encryptedAccessToken: true, encryptedRefreshToken: true,
  accessTokenExpiresAt: true, refreshTokenExpiresAt: true, githubScopes: true,
} satisfies Prisma.UserSelect;

export type StoredProfile = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
export type StoredCredentials = Prisma.UserGetPayload<{ select: typeof credentialSelect }>;
export type CredentialUpdate = Pick<StoredCredentials, 'encryptedAccessToken' | 'encryptedRefreshToken' |
  'accessTokenExpiresAt' | 'refreshTokenExpiresAt' | 'githubScopes'>;
export type ProfileUpdate = Omit<StoredProfile, 'id'> & CredentialUpdate;

export interface AuthRepository {
  upsertProfile(profile: ProfileUpdate): Promise<StoredProfile>;
  findProfile(userId: string): Promise<StoredProfile | null>;
  withLockedCredentials<T>(userId: string, action: (
    credentials: StoredCredentials | null,
    save: (update: CredentialUpdate) => Promise<void>,
  ) => Promise<T>): Promise<T>;
}

export function createAuthRepository(database: PrismaClient): AuthRepository {
  return {
    upsertProfile: (profile) => database.user.upsert({
      where: { githubId: profile.githubId }, create: profile, update: profile, select: profileSelect,
    }),
    findProfile: (id) => database.user.findUnique({ where: { id }, select: profileSelect }),
    withLockedCredentials: (id, action) => database.$transaction(async (transaction) => {
      // A database row lock also serializes refreshes from other API processes/workers.
      await transaction.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const credentials = await transaction.user.findUnique({ where: { id }, select: credentialSelect });
      return action(credentials, async (update) => {
        await transaction.user.update({ where: { id }, data: update, select: { id: true } });
      });
    }, { maxWait: 5000, timeout: 20000 }),
  };
}
