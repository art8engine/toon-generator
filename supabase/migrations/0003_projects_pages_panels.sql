-- 0003_projects_pages_panels.sql
-- 만화 프로젝트 / 페이지 / 패널 / 생성 잡

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Konva 캔버스 레이아웃
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, page_number)
);

CREATE TABLE IF NOT EXISTS panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  position JSONB NOT NULL,                      -- {x,y,w,h}
  scene_prompt_ir JSONB,                        -- PromptIR
  character_refs UUID[] NOT NULL DEFAULT '{}',
  generated_image_url TEXT,                     -- R2 영구 URL (nullable until first generation)
  generated_image_sha256 TEXT,
  provider_id TEXT,
  template_id TEXT,
  template_version TEXT,
  seed INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panels_page ON panels(page_id);

-- 백그라운드 생성 잡 (BullMQ와 양방향 동기화)
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                           -- 'character'|'scene'|'sketch'|'export'
  status TEXT NOT NULL DEFAULT 'queued',        -- queued|running|done|failed
  provider_id TEXT,
  request_json JSONB NOT NULL,
  result_json JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON generation_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status, created_at DESC);
