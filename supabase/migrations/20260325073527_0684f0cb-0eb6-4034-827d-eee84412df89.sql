
-- Fix pre-existing overly permissive RLS policies on workspace_members and workspace_registry
-- These had WITH CHECK (true) which is a security risk

-- Fix workspace_members INSERT
DROP POLICY IF EXISTS "Allow public insert to workspace_members" ON public.workspace_members;
CREATE POLICY "workspace_members_insert_auth" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix workspace_members UPDATE
DROP POLICY IF EXISTS "Allow public upsert to workspace_members" ON public.workspace_members;
CREATE POLICY "workspace_members_update_auth" ON public.workspace_members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fix workspace_registry INSERT
DROP POLICY IF EXISTS "Allow public insert to workspace_registry" ON public.workspace_registry;
CREATE POLICY "workspace_registry_insert_auth" ON public.workspace_registry
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix workspace_registry UPDATE
DROP POLICY IF EXISTS "Allow public upsert to workspace_registry" ON public.workspace_registry;
CREATE POLICY "workspace_registry_update_auth" ON public.workspace_registry
  FOR UPDATE USING (auth.uid() IS NOT NULL);
