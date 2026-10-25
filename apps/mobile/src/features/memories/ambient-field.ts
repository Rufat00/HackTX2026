import type { MemoryItem } from '@afterglow/contracts/memories';

export function createPhotoHalos(
  items: Pick<MemoryItem, 'id' | 'kind' | 'color'>[],
  frames: { id: string; x: number; y: number; width: number; height: number }[],
) {
  return items
    .filter((item) => item.kind === 'PHOTO' && item.color)
    .flatMap((item) => {
      const frame = frames.find((entry) => entry.id === item.id);
      if (!frame) return [];
      const radius = Math.max(frame.width, frame.height) * 1.8;
      const [r, g, b] = [1, 3, 5].map((offset) =>
        parseInt(item.color!.slice(offset, offset + 2), 16),
      );
      return [
        {
          id: item.id,
          left: frame.x + frame.width / 2 - radius,
          top: frame.y + frame.height / 2 - radius,
          size: radius * 2,
          backgroundImage: `radial-gradient(ellipse at center, rgba(${r},${g},${b},0.72) 0%, rgba(${r},${g},${b},0.3) 35%, rgba(${r},${g},${b},0) 72%)`,
        },
      ];
    });
}
