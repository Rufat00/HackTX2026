import { Blob } from 'expo-blob';
import { fetch as expoFetch } from 'expo/fetch';

/** Keep native files out of React Native's legacy Blob conversion path. */
export async function readUploadImage(uri: string) {
  const response = await expoFetch(uri);
  if (!response.ok)
    throw new Error('Could not read this photo. Choose it again.');
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > 10 * 1024 * 1024)
    throw new Error('Choose a photo up to 10 MB.');
  const bytes = new Uint8Array(buffer);
  const mime =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? 'image/jpeg'
      : [137, 80, 78, 71, 13, 10, 26, 10].every(
            (value, index) => bytes[index] === value,
          )
        ? 'image/png'
        : [82, 73, 70, 70].every((value, index) => bytes[index] === value) &&
            [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value)
          ? 'image/webp'
          : null;
  if (!mime) throw new Error('Choose a JPEG, PNG, or WebP photo.');
  const blob = new Blob([buffer], { type: mime });
  // Expo accepts ArrayBuffer directly, without React Native's Blob/FileReader bridge.
  return { body: await blob.arrayBuffer(), mime, byteSize: blob.size };
}
