import { describe, expect, it } from 'vitest';
import { lightTheme } from './tokens.generated';
function luminance(hex: string) {
  const linear = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
describe('accessible semantic palette', () => {
  const c = lightTheme.semantic;
  it.each([c.background, c.surface])(
    'keeps ordinary text readable on %s',
    (background) => {
      for (const foreground of [
        c.textPrimary,
        c.textSecondary,
        c.danger,
        c.success,
        c.suggestion,
      ])
        expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    },
  );
  it('keeps filled action labels and colored status labels readable', () => {
    for (const [foreground, background] of [
      [c.onAccent, c.accent],
      [c.onAccent, c.danger],
      [c.success, c.successSurface],
      [c.danger, c.dangerSurface],
      [c.suggestion, c.suggestionSurface],
    ])
      expect(contrast(foreground!, background!)).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps focus and input boundaries distinguishable from stable surfaces', () => {
    expect(contrast(c.focus, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.controlBorder, c.surface)).toBeGreaterThanOrEqual(3);
  });
});
