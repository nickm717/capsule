CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  palette jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON user_profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
