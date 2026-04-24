-- 0002_characters.sql
-- 3계층 캐릭터 모델: Character / CharacterAsset / CharacterEmbeddingCache

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_extended(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description_ir JSONB NOT NULL,               -- PromptIR (provider-neutral)
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  seed_baseline INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS character_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,                    -- 'front'|'three-quarter'|'side'|'back'|'expression-sheet'
  r2_url TEXT NOT NULL,                        -- R2 영구 URL
  sha256 TEXT NOT NULL,
  crop_box JSONB,
  face_boxes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_assets_character ON character_assets(character_id);

-- provider-specific embedding cache. provider 교체 시 전량 무효화.
CREATE TABLE IF NOT EXISTS character_embedding_cache (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  embedding BYTEA,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, provider_id, model_version)
);
