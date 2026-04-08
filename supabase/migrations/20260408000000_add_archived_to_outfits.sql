ALTER TABLE public.custom_outfits
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
