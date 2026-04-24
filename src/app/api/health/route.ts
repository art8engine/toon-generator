import { NextResponse } from 'next/server';
import { createDefaultRegistry } from '@/lib/ai/registry';
import { aiConfig } from '@config/ai';

export async function GET() {
  const registry = createDefaultRegistry();
  const available = registry.listAvailable();

  const checks: Record<string, boolean> = {};
  for (const id of available) {
    try {
      const provider = registry.get(id as (typeof available)[number] as never);
      checks[id] = await provider.healthCheck();
    } catch {
      checks[id] = false;
    }
  }

  return NextResponse.json({
    status: 'ok',
    providers: {
      available,
      routing: aiConfig.routing,
      checks,
    },
  });
}
