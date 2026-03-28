-- Add user_id to custom_items
ALTER TABLE public.custom_items
  ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Replace public RLS policies on custom_items with user-scoped ones
DROP POLICY IF EXISTS "Anyone can read custom items" ON public.custom_items;
DROP POLICY IF EXISTS "Anyone can insert custom items" ON public.custom_items;
DROP POLICY IF EXISTS "Anyone can update custom items" ON public.custom_items;
DROP POLICY IF EXISTS "Anyone can delete custom items" ON public.custom_items;

CREATE POLICY "Users can read own items" ON public.custom_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.custom_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.custom_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.custom_items
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id to custom_outfits
ALTER TABLE public.custom_outfits
  ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Replace public RLS policies on custom_outfits with user-scoped ones
DROP POLICY IF EXISTS "Anyone can read custom outfits" ON public.custom_outfits;
DROP POLICY IF EXISTS "Anyone can insert custom outfits" ON public.custom_outfits;
DROP POLICY IF EXISTS "Anyone can update custom outfits" ON public.custom_outfits;
DROP POLICY IF EXISTS "Anyone can delete custom outfits" ON public.custom_outfits;

CREATE POLICY "Users can read own outfits" ON public.custom_outfits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outfits" ON public.custom_outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outfits" ON public.custom_outfits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own outfits" ON public.custom_outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id to planner_assignments
-- First drop the global unique constraint on day_key (it must be unique per user, not globally)
ALTER TABLE public.planner_assignments
  DROP CONSTRAINT IF EXISTS planner_assignments_day_key_key;

ALTER TABLE public.planner_assignments
  ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add per-user unique constraint
ALTER TABLE public.planner_assignments
  ADD CONSTRAINT planner_assignments_day_key_user_id_key UNIQUE (day_key, user_id);

-- Replace public RLS policies on planner_assignments with user-scoped ones
DROP POLICY IF EXISTS "Anyone can read planner assignments" ON public.planner_assignments;
DROP POLICY IF EXISTS "Anyone can insert planner assignments" ON public.planner_assignments;
DROP POLICY IF EXISTS "Anyone can update planner assignments" ON public.planner_assignments;
DROP POLICY IF EXISTS "Anyone can delete planner assignments" ON public.planner_assignments;

CREATE POLICY "Users can read own assignments" ON public.planner_assignments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assignments" ON public.planner_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assignments" ON public.planner_assignments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own assignments" ON public.planner_assignments
  FOR DELETE USING (auth.uid() = user_id);
