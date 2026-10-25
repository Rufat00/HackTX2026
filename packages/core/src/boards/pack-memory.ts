import { AppError } from '@afterglow/contracts/errors';
import type { MemoryItem } from '@afterglow/contracts/memories';

export const geometryVersion = 'constellation-v2';
type Frame = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
function random(seed: string) {
  let state = 2166136261;
  for (const character of seed)
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822519);
    return (state >>> 0) / 4294967296;
  };
}
function collides(a: Frame, b: Frame) {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}
function dimensions(item: MemoryItem, next: () => number) {
  if (item.kind === 'SONG') return { width: 264, height: 300 };
  const width =
    item.kind === 'STORY' ? 272 : [208, 248, 284, 308][Math.floor(next() * 4)]!;
  const textHeight =
    Math.ceil(Array.from(item.text).length / Math.floor(width / 9)) * 24;
  return {
    width,
    height:
      item.kind === 'PHOTO'
        ? Math.ceil(
            Math.max(
              132,
              Math.min(380, (width * (item.height ?? 1)) / (item.width ?? 1)),
            ) + (item.text ? textHeight : 0),
          )
        : Math.max(72, textHeight),
  };
}
export function packMemory(items: MemoryItem[], orderedIds: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  if (
    orderedIds.length !== items.length ||
    new Set(orderedIds).size !== items.length ||
    orderedIds.some((id) => !byId.has(id))
  )
    throw new AppError(
      'invalid-state',
      'Composition contains missing, duplicate, or unknown items',
    );
  const groups = new Map<string, MemoryItem[]>();
  for (const id of orderedIds) {
    const item = byId.get(id)!;
    groups.set(item.contributorId, [
      ...(groups.get(item.contributorId) ?? []),
      item,
    ]);
  }
  const local = [...groups.entries()].map(([contributorId, group]) => {
    const songs = group.filter((item) => item.kind === 'SONG');
    if (songs.length > 1)
      throw new AppError(
        'invalid-state',
        'Keep one song per contributor before composing.',
      );
    const anchor =
      songs[0] ?? group.find((item) => item.kind === 'STORY') ?? group[0]!;
    const next = random(contributorId + group.map((item) => item.id).join(''));
    const size = dimensions(anchor, next);
    const frames: Frame[] = [
      { id: anchor.id, x: -size.width / 2, y: -size.height / 2, ...size },
    ];
    for (const item of group.filter((entry) => entry.id !== anchor.id)) {
      const size = dimensions(item, next);
      let candidate: Frame | undefined;
      for (let attempt = 0; attempt < 500; attempt++) {
        const angle = next() * Math.PI * 2,
          radius = 190 + next() * (140 + attempt * 2);
        const frame = {
          id: item.id,
          x: Math.round(Math.cos(angle) * radius - size.width / 2),
          y: Math.round(Math.sin(angle) * radius - size.height / 2),
          ...size,
        };
        if (!frames.some((other) => collides(frame, other))) {
          candidate = frame;
          break;
        }
      }
      if (!candidate)
        candidate = {
          id: item.id,
          x: Math.max(...frames.map((frame) => frame.x + frame.width)),
          y: -size.height / 2,
          ...size,
        };
      frames.push(candidate);
    }
    // Symmetric bounds keep the contributor's song exactly at the section center.
    const halfWidth = Math.ceil(
      Math.max(
        210,
        ...frames.flatMap((frame) => [
          Math.abs(frame.x),
          Math.abs(frame.x + frame.width),
        ]),
      ),
    );
    const halfHeight = Math.ceil(
      Math.max(
        210,
        ...frames.flatMap((frame) => [
          Math.abs(frame.y),
          Math.abs(frame.y + frame.height),
        ]),
      ),
    );
    return {
      contributorId,
      contributorName: group[0]!.contributorName,
      width: halfWidth * 2,
      height: halfHeight * 2,
      songItemId: songs[0]?.id ?? null,
      frames: frames.map((frame) => ({
        ...frame,
        x: frame.x + halfWidth,
        y: frame.y + halfHeight,
      })),
    };
  });
  const frames: Frame[] = [],
    sections: {
      contributorId: string;
      contributorName: string;
      x: number;
      y: number;
      width: number;
      height: number;
      songItemId: string | null;
    }[] = [];
  let y = 56;
  for (let index = 0; index < local.length; index += 2) {
    const row = local.slice(index, index + 2);
    let x = 0;
    for (const group of row) {
      sections.push({
        contributorId: group.contributorId,
        contributorName: group.contributorName,
        x,
        y,
        width: group.width,
        height: group.height,
        songItemId: group.songItemId,
      });
      frames.push(
        ...group.frames.map((frame) => ({
          ...frame,
          x: frame.x + x,
          y: frame.y + y,
        })),
      );
      x += group.width + 96;
    }
    y += Math.max(...row.map((group) => group.height)) + 112;
  }
  return { frames, sections };
}
