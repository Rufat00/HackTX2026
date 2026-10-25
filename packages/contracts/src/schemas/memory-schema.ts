import { z } from 'zod';
import { catalogSongSchema, songIdSchema } from './music-schema';
import { uploadIntentSchema } from './account-schema';

export const memoryUploadSchema = uploadIntentSchema
  .extend({ id: z.uuid() })
  .strict();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Enter a valid date');
export const boardIdSchema = z.uuid();
export const createBoardSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(1).max(80),
    eventDate: dateSchema.nullable().default(null),
  })
  .strict();
export const updateBoardSchema = createBoardSchema
  .omit({ id: true })
  .extend({ contentRevision: z.number().int().nonnegative() })
  .strict();
const songUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      ['open.spotify.com', 'music.apple.com'].includes(url.hostname)
    );
  }, 'Use a Spotify or Apple Music HTTPS link');
export const addContributionSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(['PHOTO', 'STORY', 'SONG']),
    text: z.string().trim().max(600),
    assetId: z.uuid().nullable().default(null),
    songUrl: songUrlSchema.nullable().default(null),
    songTrackId: songIdSchema.nullable().default(null),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === 'PHOTO' ? !value.assetId : !!value.assetId)
      ctx.addIssue({
        code: 'custom',
        path: ['assetId'],
        message: 'Only photos must have an uploaded image',
      });
    if (value.kind !== 'PHOTO' && !value.text)
      ctx.addIssue({
        code: 'custom',
        path: ['text'],
        message:
          value.kind === 'SONG'
            ? 'Enter a song title'
            : 'Write a little of the story',
      });
    if (
      value.kind === 'SONG'
        ? !value.songTrackId || !!value.songUrl
        : !!value.songUrl || !!value.songTrackId
    )
      ctx.addIssue({
        code: 'custom',
        path: ['songTrackId'],
        message: 'Choose a song from search',
      });
  });
export const revisionSchema = z
  .object({ contentRevision: z.number().int().nonnegative() })
  .strict();
export const publishBoardSchema = z
  .object({ layoutId: z.uuid(), visibility: z.enum(['PRIVATE', 'PUBLIC']) })
  .strict();
export const inviteContributorsSchema = z
  .object({
    userIds: z
      .array(z.string().min(1).max(128))
      .max(7)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Choose each person once',
      ),
  })
  .strict();
export const boardListInputSchema = z
  .object({
    scope: z.enum(['all', 'shared']).default('all'),
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(30).default(20),
    query: z.string().trim().max(80).default(''),
  })
  .strict();
export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
});
export const memoryItemSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['PHOTO', 'STORY', 'SONG']),
  text: z.string().max(600),
  assetId: z.uuid().nullable(),
  songUrl: songUrlSchema.nullable(),
  song: catalogSongSchema.nullable().default(null),
  contributorId: z.string(),
  contributorName: z.string(),
  width: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});
export const snapshotSchema = z.object({
  title: z.string(),
  eventDate: z.string().nullable(),
  items: z.array(memoryItemSchema).max(30),
});
export const frameSchema = z.object({
  id: z.uuid(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export const sectionSchema = z.object({
  contributorId: z.string(),
  contributorName: z.string(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  songItemId: z.uuid().nullable(),
});
export const previewSchema = z.object({
  id: z.uuid(),
  contentRevision: z.number().int(),
  label: z.string(),
  model: z.string(),
  fallbackReason: z.string().nullable(),
  promptVersion: z.string(),
  schemaVersion: z.string(),
  geometryVersion: z.string(),
  clusters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      itemIds: z.array(z.string()),
    }),
  ),
  suggestedLinks: z.array(
    z.object({
      a: z.string(),
      b: z.string(),
      reason: z.string(),
      confidence: z.number(),
    }),
  ),
  frames: z.array(frameSchema),
  sections: z.array(sectionSchema).default([]),
});
export const boardSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.string(),
  title: z.string(),
  eventDate: z.string().nullable(),
  contentRevision: z.number().int(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  publishedLayoutId: z.uuid().nullable(),
  canContribute: z.boolean(),
  canPublish: z.boolean(),
  pendingChanges: z.boolean(),
  members: z.array(personSchema),
  items: z.array(memoryItemSchema),
  preview: previewSchema.nullable(),
});
export const boardSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  ownerName: z.string(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  isMember: z.boolean(),
  isOwner: z.boolean(),
  contributorCount: z.number().int().positive(),
  published: z.boolean(),
  updatedAt: z.string(),
});
export const boardListSchema = z.object({
  items: z.array(boardSummarySchema),
  nextCursor: z.uuid().nullable(),
});
export type MemoryItem = z.infer<typeof memoryItemSchema>;
export type MemoryBoard = z.infer<typeof boardSchema>;
export type MemoryPreview = z.infer<typeof previewSchema>;
export type MemorySnapshot = z.infer<typeof snapshotSchema>;

export const updateContributionSchema = z
  .object({
    contentRevision: z.number().int().nonnegative(),
    item: addContributionSchema,
  })
  .strict();
export const peopleSearchSchema = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(/^[A-Za-z0-9_]+$/, 'Search by username')
  .transform((value) => value.toLowerCase());
