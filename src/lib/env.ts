import { z } from 'zod';

/**
 * Runtime 환경변수 검증.
 * 서버/클라이언트 분리: NEXT_PUBLIC_* 만 브라우저에 노출.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // AI providers
  REPLICATE_API_TOKEN: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Self-hosted GPU (future)
  LOCAL_GPU_ENDPOINT: z.string().url().optional().or(z.literal('')),
  LOCAL_GPU_API_KEY: z.string().optional(),

  // Storage (R2)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Queue
  REDIS_URL: z.string().optional(),

  // Payments
  TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
  TOSS_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // AI routing (swap-point)
  AI_ROUTING_CHARACTER: z.string().default('google-ai'),
  AI_ROUTING_SCENE: z.string().default('replicate'),
  AI_ROUTING_SKETCH: z.string().default('replicate'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

const clientRaw = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const clientEnv: ClientEnv = clientSchema.parse(clientRaw);

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must only be called on the server.');
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse(process.env);
  }
  return cachedServerEnv;
}
