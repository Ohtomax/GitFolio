ALTER TABLE "Deployment"
  ADD COLUMN "requestKey" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "editorRevision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repositoryName" TEXT,
  ADD COLUMN "format" VARCHAR(10),
  ADD COLUMN "snapshot" JSONB,
  ADD COLUMN "source" JSONB,
  ADD COLUMN "errorCode" VARCHAR(64),
  ADD COLUMN "buildUrl" TEXT,
  ADD COLUMN "leaseToken" UUID,
  ADD COLUMN "leaseExpiresAt" TIMESTAMPTZ(3),
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Deployment" ALTER COLUMN "requestKey" DROP DEFAULT;
-- Historical unfinished records have no immutable snapshot and cannot be published safely.
-- Preserve their history and mark the attempts terminal before enforcing one active attempt.
UPDATE "Deployment" SET "status" = 'FAILED', "completedAt" = CURRENT_TIMESTAMP,
  "errorCode" = 'LEGACY_DEPLOYMENT_UNAVAILABLE'
  WHERE "status" IN ('PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING');
CREATE UNIQUE INDEX "Deployment_userId_requestKey_key" ON "Deployment"("userId", "requestKey");
CREATE UNIQUE INDEX "Deployment_one_active_project_key" ON "Deployment"("projectId")
  WHERE "status" IN ('PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING');
CREATE UNIQUE INDEX "Deployment_one_active_target_key" ON "Deployment"("userId", lower("repositoryName"))
  WHERE "repositoryName" IS NOT NULL AND "status" IN ('PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING');
