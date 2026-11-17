ALTER TABLE "User"
  ADD COLUMN "encryptedRefreshToken" TEXT,
  ADD COLUMN "accessTokenExpiresAt" TIMESTAMPTZ(3),
  ADD COLUMN "refreshTokenExpiresAt" TIMESTAMPTZ(3),
  ADD COLUMN "githubScopes" TEXT NOT NULL DEFAULT '';
