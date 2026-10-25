import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { MemoryItem } from '@afterglow/contracts/memories';
import { packMemory } from './pack-memory';

describe('contributor memory sections', () => {
  const items: MemoryItem[] = Array.from({ length: 30 }, (_, index) => {
    const kind = index % 10 === 0 ? 'SONG' : index % 3 ? 'PHOTO' : 'STORY';
    return {
      id: randomUUID(),
      kind,
      text: 'A memory. '.repeat(index),
      assetId: kind === 'PHOTO' ? randomUUID() : null,
      songUrl:
        kind === 'SONG' ? 'https://open.spotify.com/track/example' : null,
      song: null,
      contributorId: `person-${Math.floor(index / 10)}`,
      contributorName: `Person ${Math.floor(index / 10)}`,
      width: 80 + index * 53,
      height: 1600 - index * 39,
      color: '#cc8844',
    };
  });
  it('keeps all content in its contributor section without any overlapping card pairs', () => {
    const result = packMemory(
      items,
      items.map((item) => item.id),
    );
    expect(new Set(result.frames.map((frame) => frame.id))).toEqual(
      new Set(items.map((item) => item.id)),
    );
    expect(result.sections).toHaveLength(3);
    for (const frame of result.frames) {
      const item = items.find((entry) => entry.id === frame.id)!;
      const section = result.sections.find(
        (entry) => entry.contributorId === item.contributorId,
      )!;
      expect(frame.x).toBeGreaterThanOrEqual(section.x);
      expect(frame.y).toBeGreaterThanOrEqual(section.y);
      expect(frame.x + frame.width).toBeLessThanOrEqual(
        section.x + section.width,
      );
      expect(frame.y + frame.height).toBeLessThanOrEqual(
        section.y + section.height,
      );
    }
    for (let a = 0; a < result.frames.length; a++)
      for (let b = a + 1; b < result.frames.length; b++) {
        const first = result.frames[a]!,
          second = result.frames[b]!;
        expect(
          first.x + first.width <= second.x ||
            second.x + second.width <= first.x ||
            first.y + first.height <= second.y ||
            second.y + second.height <= first.y,
        ).toBe(true);
      }
    expect(
      packMemory(
        items,
        items.map((item) => item.id),
      ),
    ).toEqual(result);
  });
  it('centers each song exactly and varies photo sizes and positions', () => {
    const { sections, frames } = packMemory(
      items,
      items.map((item) => item.id),
    );
    for (const section of sections) {
      const song = frames.find((frame) => frame.id === section.songItemId)!;
      expect(song.x + song.width / 2).toBe(section.x + section.width / 2);
      expect(song.y + song.height / 2).toBe(section.y + section.height / 2);
    }
    expect(
      new Set(
        frames
          .filter(
            (frame) =>
              items.find((item) => item.id === frame.id)?.kind === 'PHOTO',
          )
          .map((frame) => frame.width),
      ).size,
    ).toBeGreaterThan(1);
  });
  it('refuses duplicate, missing, invented and duplicate-song content', () => {
    const ids = items.map((item) => item.id);
    expect(() => packMemory(items, ids.slice(1))).toThrow();
    expect(() => packMemory(items, [...ids.slice(1), ids[1]!])).toThrow();
    expect(() => packMemory(items, [...ids.slice(1), randomUUID()])).toThrow();
    const duplicateSong = { ...items[0]!, id: randomUUID() };
    expect(() =>
      packMemory([...items, duplicateSong], [...ids, duplicateSong.id]),
    ).toThrow('one song');
  });
});
