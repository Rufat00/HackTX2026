import { expect, it, vi } from 'vitest';
import { getCatalogSong, searchCatalog } from './catalog';
const track = {
  kind: 'song',
  trackId: 12345,
  trackName: 'A song',
  artistName: 'An artist',
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/example.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
  trackViewUrl: 'https://music.apple.com/us/album/song/123?i=12345',
};
it('validates the catalog response and searches the fixed music provider', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(Response.json({ results: [track] }));
  const songs = await searchCatalog('A song', fetcher);
  expect(songs[0]).toMatchObject({
    id: '12345',
    title: 'A song',
    artist: 'An artist',
    previewUrl: track.previewUrl,
  });
  expect(new URL(fetcher.mock.calls[0]![0]).origin).toBe(
    'https://itunes.apple.com',
  );
  expect(new URL(fetcher.mock.calls[0]![0]).searchParams.get('term')).toBe(
    'A song',
  );
});
it('allows unpreviewable tracks but rejects untrusted media hosts', async () => {
  const songs = await searchCatalog(
    'test',
    vi.fn().mockResolvedValue(
      Response.json({
        results: [
          { ...track, previewUrl: undefined },
          { ...track, previewUrl: 'https://evil.example/file' },
        ],
      }),
    ),
  );
  expect(songs).toHaveLength(1);
  expect(songs[0]!.previewUrl).toBeNull();
});
it('returns safe unavailable/not-found errors for failed or missing tracks', async () => {
  await expect(
    searchCatalog(
      'test',
      vi.fn().mockResolvedValue(new Response('<html>failure</html>')),
    ),
  ).rejects.toMatchObject({ code: 'provider-unavailable' });
  await expect(
    getCatalogSong(
      '12345',
      vi.fn().mockResolvedValue(Response.json({ results: [] })),
    ),
  ).rejects.toMatchObject({ code: 'not-found' });
});
