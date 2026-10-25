-- CreateEnum
CREATE TYPE "BoardVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ContributionKind" AS ENUM ('PHOTO', 'STORY', 'SONG');

-- CreateEnum
CREATE TYPE "LayoutStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- AlterEnum
ALTER TYPE "AssetPurpose" ADD VALUE 'MEMORY';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "boardId" UUID,
ADD COLUMN     "color" TEXT;

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventDate" DATE,
    "contentRevision" INTEGER NOT NULL DEFAULT 0,
    "visibility" "BoardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "publishedLayoutId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_members" (
    "boardId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_members_pkey" PRIMARY KEY ("boardId","userId")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "contributorId" TEXT NOT NULL,
    "kind" "ContributionKind" NOT NULL,
    "text" TEXT NOT NULL,
    "songUrl" TEXT,
    "assetId" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_layouts" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "contentRevision" INTEGER NOT NULL,
    "status" "LayoutStatus" NOT NULL DEFAULT 'PROCESSING',
    "snapshot" JSONB NOT NULL,
    "analysis" JSONB,
    "geometryVersion" TEXT NOT NULL DEFAULT 'masonry-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_audits" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "actorId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boards_publishedLayoutId_key" ON "boards"("publishedLayoutId");

-- CreateIndex
CREATE INDEX "boards_ownerUserId_updatedAt_id_idx" ON "boards"("ownerUserId", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "board_members_userId_boardId_idx" ON "board_members"("userId", "boardId");

-- CreateIndex
CREATE INDEX "contributions_boardId_deletedAt_createdAt_id_idx" ON "contributions"("boardId", "deletedAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "board_layouts_boardId_status_createdAt_id_idx" ON "board_layouts"("boardId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "board_audits_boardId_createdAt_idx" ON "board_audits"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_publishedLayoutId_fkey" FOREIGN KEY ("publishedLayoutId") REFERENCES "board_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_layouts" ADD CONSTRAINT "board_layouts_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_audits" ADD CONSTRAINT "board_audits_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep private asset purposes scoped, and retain the profile image bound.
ALTER TABLE "assets" DROP CONSTRAINT "assets_ready_derivative";
ALTER TABLE "assets" ADD CONSTRAINT "assets_ready_derivative" CHECK (
  "status" <> 'READY' OR (
    "derivativeKey" IS NOT NULL AND "verifiedAt" IS NOT NULL
    AND "width" IS NOT NULL AND "height" IS NOT NULL AND "derivativeByteSize" > 0
    AND "width" BETWEEN 1 AND CASE WHEN "purpose"::text = 'PROFILE' THEN 400 ELSE 1600 END
    AND "height" BETWEEN 1 AND CASE WHEN "purpose"::text = 'PROFILE' THEN 400 ELSE 1600 END
  )
);
ALTER TABLE "assets" ADD CONSTRAINT "assets_board_purpose" CHECK (
  ("purpose"::text = 'PROFILE' AND "boardId" IS NULL) OR ("purpose"::text = 'MEMORY' AND "boardId" IS NOT NULL)
);
ALTER TABLE "boards" ADD CONSTRAINT "boards_revision_title" CHECK ("contentRevision" >= 0 AND char_length("title") BETWEEN 1 AND 80);
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_shape" CHECK (
  char_length("text") <= 600 AND
  (("kind" = 'PHOTO' AND "assetId" IS NOT NULL AND "songUrl" IS NULL) OR
   ("kind" = 'STORY' AND "assetId" IS NULL AND "songUrl" IS NULL AND char_length("text") > 0) OR
   ("kind" = 'SONG' AND "assetId" IS NULL AND "songUrl" IS NOT NULL AND char_length("text") > 0))
);
ALTER TABLE "board_layouts" ADD CONSTRAINT "layouts_ready_analysis" CHECK ("status" <> 'READY' OR "analysis" IS NOT NULL);
