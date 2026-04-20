-- ============================================================
-- Smart Persona Project — Supabase Schema
-- รัน SQL นี้ใน Supabase SQL Editor ก่อนใช้งาน app
-- ============================================================

-- 1. profiles (เชื่อมกับ auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  website     TEXT,
  role        TEXT DEFAULT 'user',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: read public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles: user can update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: user can insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────

-- 2. profile_cards (Vtree / personal profiles)
CREATE TABLE IF NOT EXISTS public.profile_cards (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT DEFAULT 'personal',
  name        TEXT,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_cards: user owns" ON public.profile_cards FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

-- 3. professional_profiles (LinkedIn-style profiles)
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professional_profiles: read public" ON public.professional_profiles FOR SELECT USING (true);
CREATE POLICY "professional_profiles: user owns" ON public.professional_profiles FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

-- 4. profile_views (analytics)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID,
  viewer_username  TEXT DEFAULT 'anonymous',
  viewed_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_views: insert public" ON public.profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "profile_views: read all" ON public.profile_views FOR SELECT USING (true);
CREATE POLICY "profile_views: delete admin" ON public.profile_views FOR DELETE USING (true);

-- ──────────────────────────────────────────────────────────────

-- 5. community_themes
CREATE TABLE IF NOT EXISTS public.community_themes (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "profileType" TEXT,
  name         TEXT,
  author       TEXT,
  source       TEXT DEFAULT 'community',
  tags         JSONB DEFAULT '[]',
  preview      JSONB DEFAULT '{}',
  stats        JSONB DEFAULT '{"uses":0,"trending":false}',
  tokens       JSONB DEFAULT '{}',
  "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_themes: read all" ON public.community_themes FOR SELECT USING (true);
CREATE POLICY "community_themes: user can insert" ON public.community_themes FOR INSERT WITH CHECK (true);
CREATE POLICY "community_themes: user can delete own" ON public.community_themes FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

-- 6. saved_themes
CREATE TABLE IF NOT EXISTS public.saved_themes (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "profileType" TEXT,
  name         TEXT,
  author       TEXT,
  source       TEXT DEFAULT 'saved',
  tags         JSONB DEFAULT '[]',
  preview      JSONB DEFAULT '{}',
  stats        JSONB DEFAULT '{"uses":0,"trending":false}',
  tokens       JSONB DEFAULT '{}',
  "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_themes: user owns" ON public.saved_themes FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

-- 7. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- allow extra columns from reportData (use JSONB extra column)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports: insert public" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports: read admin" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports: update admin" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "reports: delete admin" ON public.reports FOR DELETE USING (true);

-- ──────────────────────────────────────────────────────────────

-- profile_likes (ให้ user คนอื่นกดใจโปรไฟล์ได้)
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, user_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_likes: read public"  ON public.profile_likes FOR SELECT USING (true);
CREATE POLICY "profile_likes: user owns"    ON public.profile_likes FOR ALL   USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

-- saved_profiles (bookmark โปรไฟล์)
CREATE TABLE IF NOT EXISTS public.saved_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_profiles: user owns" ON public.saved_profiles FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "saved_profiles: read own"  ON public.saved_profiles FOR SELECT USING (auth.uid() = user_id);

-- RPC สำหรับปรับ vheartLikes (security definer เพื่อ bypass RLS ของ professional_profiles)
CREATE OR REPLACE FUNCTION public.adjust_vheart_likes(p_profile_id UUID, p_delta INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_data  JSONB;
  current_likes INT;
  new_likes     INT;
BEGIN
  SELECT data INTO current_data FROM public.professional_profiles WHERE id = p_profile_id;
  current_likes := COALESCE((current_data->>'vheartLikes')::INT, 0);
  new_likes     := GREATEST(0, current_likes + p_delta);
  UPDATE public.professional_profiles
    SET data       = data || jsonb_build_object('vheartLikes', new_likes, 'followers', new_likes),
        updated_at = NOW()
  WHERE id = p_profile_id;
END;
$$;
