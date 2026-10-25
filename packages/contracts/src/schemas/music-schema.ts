import { z } from 'zod';

const appleAssetSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    (url.hostname.endsWith('.mzstatic.com') ||
      url.hostname.endsWith('.itunes.apple.com'))
  );
}, 'Invalid catalog asset');
const appleStoreSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    ['music.apple.com', 'itunes.apple.com'].includes(url.hostname)
  );
}, 'Invalid catalog link');
export const songIdSchema = z
  .string()
  .regex(/^\d{1,20}$/, 'Choose a song from search');
export const songSearchSchema = z.string().trim().min(2).max(100);
export const catalogSongSchema = z.object({
  id: songIdSchema,
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(200),
  artworkUrl: appleAssetSchema.nullable(),
  previewUrl: appleAssetSchema.nullable(),
  storeUrl: appleStoreSchema,
});
export const catalogResponseSchema = z.object({
  results: z
    .array(
      z.object({
        kind: z.string(),
        trackId: z.number().int().positive(),
        trackName: z.string().min(1).max(300),
        artistName: z.string().min(1).max(200),
        artworkUrl100: z.string().optional(),
        previewUrl: z.string().optional(),
        trackViewUrl: z.string(),
      }),
    )
    .max(100),
});
export type CatalogSong = z.infer<typeof catalogSongSchema>;
