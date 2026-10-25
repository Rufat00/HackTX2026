import { beforeEach, expect, it, vi } from 'vitest';
const fetchFile = vi.hoisted(() => vi.fn());
vi.mock('expo/fetch', () => ({ fetch: fetchFile }));
vi.mock('expo-blob', async () => ({
  Blob: (await import('node:buffer')).Blob,
}));
import { readUploadImage } from './upload-image';

beforeEach(() => fetchFile.mockReset());
it.each([
  ['image/jpeg', [255, 216, 255, 224, 42]],
  ['image/png', [137, 80, 78, 71, 13, 10, 26, 10, 42]],
  ['image/webp', [82, 73, 70, 70, 1, 2, 3, 4, 87, 69, 66, 80, 42]],
])(
  'preserves binary bytes and detects %s without calling Response.blob',
  async (mime, values) => {
    const bytes = Uint8Array.from(values as number[]);
    const legacyBlob = vi.fn(() => {
      throw new Error('Legacy Blob must not be used');
    });
    fetchFile.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes.buffer,
      blob: legacyBlob,
    });
    const image = await readUploadImage('file:///photo');
    expect(image.mime).toBe(mime);
    expect(image.byteSize).toBe(bytes.length);
    expect(new Uint8Array(image.body)).toEqual(bytes);
    expect(legacyBlob).not.toHaveBeenCalled();
  },
);
it.each([0, 10 * 1024 * 1024 + 1])(
  'rejects an invalid byte size %s',
  async (size) => {
    fetchFile.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(size),
    });
    await expect(readUploadImage('file:///photo')).rejects.toThrow('10 MB');
  },
);
it('rejects unsupported actual bytes instead of trusting a picker MIME declaration', async () => {
  fetchFile.mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  });
  await expect(readUploadImage('file:///photo.jpg')).rejects.toThrow(
    'JPEG, PNG, or WebP',
  );
});
it('gives a recoverable error for a missing picker file', async () => {
  fetchFile.mockResolvedValue({ ok: false });
  await expect(readUploadImage('file:///missing')).rejects.toThrow(
    'Choose it again',
  );
});
