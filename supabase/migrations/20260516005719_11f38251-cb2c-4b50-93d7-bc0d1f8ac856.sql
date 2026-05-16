
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS channel_no text,
  ADD COLUMN IF NOT EXISTS epg_id text,
  ADD COLUMN IF NOT EXISTS epg_url text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS drm_type text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS tvhpp_slug text,
  ADD COLUMN IF NOT EXISTS proxy_provider text,
  ADD COLUMN IF NOT EXISTS proxy_backups jsonb DEFAULT '[]'::jsonb;
