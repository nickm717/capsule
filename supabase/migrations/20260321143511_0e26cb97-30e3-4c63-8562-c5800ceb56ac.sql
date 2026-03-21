
CREATE TABLE public.planner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key text NOT NULL UNIQUE,
  outfit_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.planner_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read planner assignments"
  ON public.planner_assignments FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert planner assignments"
  ON public.planner_assignments FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update planner assignments"
  ON public.planner_assignments FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete planner assignments"
  ON public.planner_assignments FOR DELETE TO public USING (true);
