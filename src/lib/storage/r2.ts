import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { storageConfig } from '@config/storage';
import type { ObjectStorageClient } from './ingestion';

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;
  const cfg = storageConfig.r2;
  if (!cfg.accountId || !cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error('R2 credentials are not configured');
  }
  cached = new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cached;
}

export const r2StorageClient: ObjectStorageClient = {
  async putObject({ bucket, key, body, contentType }) {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  },
};
