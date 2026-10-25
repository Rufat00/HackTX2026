import {
  catalogResponseSchema,
  catalogSongSchema,
  songIdSchema,
  songSearchSchema,
  type CatalogSong,
} from '@afterglow/contracts/music';
import { AppError } from '@afterglow/contracts/errors';

const cache = new Map<string, { expiresAt: number; songs: CatalogSong[] }>();
async function requestCatalog(
  path: string,
  fetcher: typeof fetch,
): Promise<CatalogSong[]> {
  const cached = cache.get(path);
  if (fetcher === fetch && cached && cached.expiresAt > Date.now())
    return cached.songs;
  try {
    const response = await fetcher(`https://itunes.apple.com/${path}`, {
      signal: AbortSignal.timeout(6000),
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Catalog unavailable');
    const songs = catalogResponseSchema
      .parse(await response.json())
      .results.flatMap((track) => {
        if (track.kind !== 'song') return [];
        const parsed = catalogSongSchema.safeParse({
          id: String(track.trackId),
          title: track.trackName,
          artist: track.artistName,
          artworkUrl: track.artworkUrl100?.replace(/^http:/, 'https:') ?? null,
          previewUrl: track.previewUrl?.replace(/^http:/, 'https:') ?? null,
          storeUrl: track.trackViewUrl.replace(/^http:/, 'https:'),
        });
        return parsed.success ? [parsed.data] : [];
      });
    if (fetcher === fetch) {
      if (cache.size >= 200) cache.delete(cache.keys().next().value!);
      cache.set(path, { expiresAt: Date.now() + 60000, songs });
    }
    return songs;
  } catch {
    throw new AppError(
      'provider-unavailable',
      'Song search is unavailable. Try again.',
    );
  }
}
export async function searchCatalog(
  input: unknown,
  fetcher: typeof fetch = fetch,
) {
  const query = songSearchSchema.parse(input);
  return requestCatalog(
    `search?${new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: '20', country: 'US' })}`,
    fetcher,
  );
}
export async function getCatalogSong(
  input: unknown,
  fetcher: typeof fetch = fetch,
) {
  const id = songIdSchema.parse(input);
  const song = (
    await requestCatalog(
      `lookup?id=${encodeURIComponent(id)}&entity=song`,
      fetcher,
    )
  ).find((entry) => entry.id === id);
  if (!song)
    throw new AppError(
      'not-found',
      'This song is no longer in the catalog. Choose another.',
    );
  if (!song.previewUrl)
    throw new AppError(
      'validation',
      'This song has no playable preview. Choose another.',
    );
  return song;
}
