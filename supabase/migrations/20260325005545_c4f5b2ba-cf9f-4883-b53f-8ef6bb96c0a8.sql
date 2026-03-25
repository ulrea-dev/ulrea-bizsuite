
-- Workspace registry (populated by app on connect/sync)
CREATE TABLE public.workspace_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id text UNIQUE NOT NULL,
  workspace_name text NOT NULL,
  owner_email text,
  owner_display_name text,
  last_sync_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Workspace members (populated when users access a shared workspace)
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_folder_id text NOT NULL REFERENCES public.workspace_registry(folder_id) ON DELETE CASCADE,
  member_email text,
  member_display_name text,
  role text DEFAULT 'member',
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(workspace_folder_id, member_email)
);

-- Super admin role table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspace_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = _user_id
  )
$$;

-- workspace_registry: anyone can upsert (app passive registration), only super admins can read
CREATE POLICY "Allow public insert to workspace_registry"
  ON public.workspace_registry
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public upsert to workspace_registry"
  ON public.workspace_registry
  FOR UPDATE
  USING (true);

CREATE POLICY "Super admins can view workspace_registry"
  ON public.workspace_registry
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- workspace_members: anyone can upsert, only super admins can read
CREATE POLICY "Allow public insert to workspace_members"
  ON public.workspace_members
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public upsert to workspace_members"
  ON public.workspace_members
  FOR UPDATE
  USING (true);

CREATE POLICY "Super admins can view workspace_members"
  ON public.workspace_members
  FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- super_admins: only the authenticated user can see their own row
CREATE POLICY "Users can view their own super_admin record"
  ON public.super_admins
  FOR SELECT
  USING (auth.uid() = user_id);
