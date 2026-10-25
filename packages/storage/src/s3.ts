import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { maxSourceBytes, InvalidImageError } from './images';
export type StorageConfig = {
  endpoint?: string;
  publicEndpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};
export function createStorage(config: StorageConfig) {
  const options = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  };
  const client = new S3Client({ ...options, endpoint: config.endpoint });
  const signer = new S3Client({
    ...options,
    endpoint: config.publicEndpoint ?? config.endpoint,
  });
  const bucket = config.bucket;
  return {
    async initialize() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode !== 404
        )
          throw error;
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    },
    async signUpload(key: string, mime: string, byteSize: number) {
      return getSignedUrl(
        signer,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: mime,
          ContentLength: byteSize,
        }),
        {
          expiresIn: 600,
          signableHeaders: new Set(['content-type', 'content-length']),
        },
      );
    },
    async writeSource(key: string, bytes: Buffer, mime: string) {
      if (bytes.length > maxSourceBytes)
        throw new InvalidImageError('Image exceeds 10 MB');
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: mime,
        }),
      );
    },
    async readDerivative(key: string) {
      const object = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!object.Body) throw new InvalidImageError('Image is missing');
      return Buffer.from(await object.Body.transformToByteArray());
    },
    async readSource(key: string) {
      const object = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!object.Body) throw new InvalidImageError('Upload is missing');
      if ((object.ContentLength ?? 0) > maxSourceBytes) {
        object.Body.transformToWebStream().cancel();
        throw new InvalidImageError('Image exceeds 10 MB');
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
        size += chunk.length;
        if (size > maxSourceBytes)
          throw new InvalidImageError('Image exceeds 10 MB');
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },
    async writeDerivative(key: string, bytes: Buffer) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: 'image/webp',
          IfNoneMatch: '*',
        }),
      );
    },
    async signDownload(key: string) {
      return getSignedUrl(
        signer,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 300 },
      );
    },
    async remove(key: string) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
export type Storage = ReturnType<typeof createStorage>;
