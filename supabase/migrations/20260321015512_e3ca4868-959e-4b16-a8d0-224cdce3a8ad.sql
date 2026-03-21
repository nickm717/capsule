-- Create custom_outfits table
CREATE TABLE public.custom_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pieces JSONB NOT NULL DEFAULT '[]'::jsonb,
  temp TEXT NOT NULL DEFAULT 'Cool',
  notes TEXT DEFAULT '',
  occasion_id TEXT NOT NULL DEFAULT 'casual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_outfits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Anyone can read custom outfits"
  ON public.custom_outfits FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "Anyone can insert custom outfits"
  ON public.custom_outfits FOR INSERT WITH CHECK (true);

-- Allow anyone to delete
CREATE POLICY "Anyone can delete custom outfits"
  ON public.custom_outfits FOR DELETE USING (true);