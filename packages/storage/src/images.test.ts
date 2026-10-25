import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processProfileImage } from './images';
describe('private profile derivatives', () => {
  it('checks actual format instead of the claimed MIME', async () => {
    const bytes = await sharp({
      create: { width: 20, height: 10, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    await expect(processProfileImage(bytes, 'image/jpeg')).rejects.toThrow();
  });
  it('rejects spoofed bytes and large sources', async () => {
    await expect(
      processProfileImage(Buffer.from('not a photo'), 'image/png'),
    ).rejects.toThrow();
    await expect(
      processProfileImage(Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png'),
    ).rejects.toThrow();
  });
  it('strips EXIF, orients and bounds the immutable derivative', async () => {
    const bytes = await sharp({
      create: { width: 800, height: 200, channels: 3, background: 'red' },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const result = await processProfileImage(bytes, 'image/jpeg');
    const meta = await sharp(result.bytes).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(400);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });
  it('rejects excessive decoded dimensions', async () => {
    const bytes = await sharp({
      create: { width: 5001, height: 5000, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    await expect(processProfileImage(bytes, 'image/png')).rejects.toThrow();
  });
});
