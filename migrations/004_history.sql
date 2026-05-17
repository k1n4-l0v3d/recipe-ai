CREATE TABLE IF NOT EXISTS history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id     TEXT NOT NULL,
  recipe_name   TEXT NOT NULL,
  image_keyword TEXT,
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS history_user_id_idx ON history(user_id);
