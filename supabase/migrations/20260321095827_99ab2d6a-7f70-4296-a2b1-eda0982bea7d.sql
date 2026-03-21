CREATE TABLE public.custom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text DEFAULT '',
  category text NOT NULL DEFAULT 'tops',
  color text NOT NULL DEFAULT '',
  hex text NOT NULL DEFAULT '#5C3317',
  notes text DEFAULT '',
  owned boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom items" ON public.custom_items FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert custom items" ON public.custom_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update custom items" ON public.custom_items FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete custom items" ON public.custom_items FOR DELETE TO public USING (true);