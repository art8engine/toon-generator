import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';

/**
 * 브라우저에서 사용하는 Supabase 클라이언트. anon key만 사용.
 * 서버 전용(service-role key)은 createServerClient를 따로 만들어 쓴다.
 */
export function createBrowserClient(): SupabaseClient {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)');
  }
  return createClient(url, key);
}

export function createServerClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServerClient() must only be called on the server');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server Supabase env vars are not set');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
