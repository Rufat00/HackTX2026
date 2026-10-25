import { expect, it } from 'vitest';
import { createPhotoHalos } from './ambient-field';
it('anchors overlapping feathered photo colors in world coordinates', () => {
  const frames = [
    { id: 'a', x: 0, y: 0, width: 308, height: 300 },
    { id: 'b', x: 324, y: 0, width: 308, height: 300 },
  ];
  const halos = createPhotoHalos(
    [
      { id: 'a', kind: 'PHOTO', color: '#ff0000' },
      { id: 'b', kind: 'PHOTO', color: '#0000ff' },
      { id: 'text', kind: 'STORY', color: '#00ff00' },
    ],
    frames,
  );
  expect(halos).toHaveLength(2);
  expect(halos[0]!.left + halos[0]!.size / 2).toBeCloseTo(154);
  expect(halos[0]!.top + halos[0]!.size / 2).toBeCloseTo(150);
  expect(halos[0]!.left + halos[0]!.size).toBeGreaterThan(halos[1]!.left);
  expect(halos[0]!.backgroundImage).toContain('rgba(255,0,0,0.72)');
  expect(halos[0]!.backgroundImage).toContain('rgba(255,0,0,0) 72%');
  expect(createPhotoHalos([], frames)).toEqual([]);
});
