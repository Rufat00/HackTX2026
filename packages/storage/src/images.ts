import sharp from 'sharp';
export const maxSourceBytes = 10 * 1024 * 1024;
export class InvalidImageError extends Error {}
export async function processProfileImage(bytes: Buffer, declaredMime: string) {
  return processImage(bytes, declaredMime, 400);
}
export async function processMemoryImage(bytes: Buffer, declaredMime: string) {
  const image = await processImage(bytes, declaredMime, 1600);
  const { dominant } = await sharp(image.bytes).stats();
  return {
    ...image,
    color:
      '#' +
      [dominant.r, dominant.g, dominant.b]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join(''),
  };
}
async function processImage(
  bytes: Buffer,
  declaredMime: string,
  bound: number,
) {
  if (bytes.length === 0 || bytes.length > maxSourceBytes)
    throw new InvalidImageError('Image must be at most 10 MB');
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25_000_000,
      failOn: 'warning',
      animated: false,
    });
    const meta = await image.metadata();
    const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[
      meta.format as 'jpeg' | 'png' | 'webp'
    ];
    if (
      !mime ||
      mime !== declaredMime ||
      !meta.width ||
      !meta.height ||
      (meta.pages ?? 1) > 1 ||
      meta.width * meta.height > 25_000_000
    )
      throw new InvalidImageError(
        'Use a single JPEG, PNG or WebP image up to 25 megapixels',
      );
    // rotate applies EXIF orientation; metadata is stripped by default.
    const { data, info } = await image
      .rotate()
      .resize({
        width: bound,
        height: bound,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      bytes: data,
      mime: 'image/webp',
      width: info.width,
      height: info.height,
      byteSize: data.length,
    };
  } catch (error) {
    if (error instanceof InvalidImageError) throw error;
    throw new InvalidImageError('The image could not be decoded');
  }
}
