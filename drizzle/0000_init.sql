CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY NOT NULL,
  description TEXT NOT NULL,
  campus_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  media_path TEXT,
  media_mime_type TEXT,
  media_size INTEGER,
  public_name TEXT,
  submitter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderated_at TEXT,
  approved_at TEXT
);

CREATE INDEX IF NOT EXISTS complaints_status_idx
  ON complaints (status);

CREATE INDEX IF NOT EXISTS complaints_campus_status_idx
  ON complaints (campus_id, status);

CREATE INDEX IF NOT EXISTS complaints_created_at_idx
  ON complaints (created_at);
