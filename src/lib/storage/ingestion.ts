import { createHash } from 'node:crypto';
import { storageConfig } from '@config/storage';

/**
 * ImageIngestionService — 프로바이더가 반환한 단기 URL을 R2에 영구 저장.
 *
 * 이유:
 *   - Replicate CDN은 24h 후 만료
 *   - Google AI 반환 data:URL은 DB에 넣으면 비대
 *   - 항상 R2의 영구 URL + sha256만 DB에 저장해야 링크 부패 방지
 *
 * 사용 흐름:
 *   const result = await provider.generate(req);
 *   const persisted = await ingestion.persist(result.imageUrl, { key: paths.panel(panelId) });
 *   // DB 저장: persisted.url, persisted.sha256
 */

export interface PersistedImage {
  url: string;
  key: string;
  sha256: string;
  sizeBytes: number;
  contentType: string;
}

export interface ObjectStorageClient {
  putObject(params: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<void>;
}

export class ImageIngestionService {
  constructor(
    private client: ObjectStorageClient,
    private config = storageConfig.r2,
  ) {}

  async persist(
    sourceUrl: string,
    opts: { key: string; contentType?: string },
  ): Promise<PersistedImage> {
    const { body, contentType } = await fetchAsBuffer(sourceUrl, opts.contentType);
    const sha256 = createHash('sha256').update(body).digest('hex');

    await this.client.putObject({
      bucket: this.config.bucket,
      key: opts.key,
      body,
      contentType,
    });

    return {
      url: publicUrl(this.config, opts.key),
      key: opts.key,
      sha256,
      sizeBytes: body.byteLength,
      contentType,
    };
  }
}

async function fetchAsBuffer(
  sourceUrl: string,
  contentTypeHint?: string,
): Promise<{ body: Buffer; contentType: string }> {
  if (sourceUrl.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.*)$/.exec(sourceUrl);
    if (!match) throw new Error('invalid data URL');
    return {
      body: Buffer.from(match[2], 'base64'),
      contentType: contentTypeHint ?? match[1],
    };
  }
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`failed to fetch image: ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const contentType =
    contentTypeHint ?? res.headers.get('content-type') ?? 'image/png';
  return { body, contentType };
}

function publicUrl(cfg: typeof storageConfig.r2, key: string): string {
  if (cfg.publicUrl) return `${cfg.publicUrl.replace(/\/$/, '')}/${key}`;
  if (cfg.endpoint) return `${cfg.endpoint}/${cfg.bucket}/${key}`;
  return `r2://${cfg.bucket}/${key}`;
}
