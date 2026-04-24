export const storageConfig = {
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? 'toongen-images',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
    endpoint: process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : '',
  },
  paths: {
    characterAssets: (characterId: string, assetType: string) =>
      `characters/${characterId}/${assetType}-${Date.now()}.png`,
    panelRender: (panelId: string) => `panels/${panelId}-${Date.now()}.png`,
    exportBundle: (projectId: string) => `exports/${projectId}-${Date.now()}.pdf`,
  },
  signedUrlTtlSec: 3600,
} as const;

export type StorageConfig = typeof storageConfig;
