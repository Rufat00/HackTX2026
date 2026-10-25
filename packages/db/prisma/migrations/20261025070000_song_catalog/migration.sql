-- AlterTable
ALTER TABLE "contributions" ADD COLUMN     "song" JSONB;

-- Tombstones allow replacing a removed song while preventing concurrent duplicates.
CREATE UNIQUE INDEX "contributions_one_song_per_person" ON "contributions" ("boardId", "contributorId") WHERE "kind" = 'SONG' AND "deletedAt" IS NULL;
