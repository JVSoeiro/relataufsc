CREATE TABLE complaints_next (
  id TEXT PRIMARY KEY NOT NULL,
  campus_id TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  media_path TEXT,
  media_kind TEXT,
  media_mime_type TEXT,
  media_size_bytes INTEGER,
  public_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  moderated_at TEXT,
  approved_at TEXT,
  submitter_email TEXT
);

INSERT INTO complaints_next (
  id,
  campus_id,
  description,
  latitude,
  longitude,
  media_path,
  media_kind,
  media_mime_type,
  media_size_bytes,
  public_name,
  status,
  created_at,
  moderated_at,
  approved_at,
  submitter_email
)
SELECT
  id,
  campus_id,
  description,
  latitude,
  longitude,
  CASE
    WHEN media_path LIKE 'approved/%' THEN REPLACE(media_path, 'approved/', 'public/')
    ELSE media_path
  END,
  CASE
    WHEN media_mime_type LIKE 'image/%' THEN 'image'
    WHEN media_mime_type LIKE 'video/%' THEN 'video'
    ELSE NULL
  END,
  media_mime_type,
  media_size,
  public_name,
  status,
  created_at,
  moderated_at,
  approved_at,
  CASE
    WHEN status = 'pending' THEN submitter_email
    ELSE NULL
  END
FROM complaints;

DROP TABLE complaints;
ALTER TABLE complaints_next RENAME TO complaints;

CREATE INDEX complaints_status_idx
  ON complaints (status);

CREATE INDEX complaints_campus_status_idx
  ON complaints (campus_id, status);

CREATE INDEX complaints_created_at_idx
  ON complaints (created_at);

CREATE INDEX complaints_campus_created_at_idx
  ON complaints (campus_id, created_at);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS submission_rate_limits_key_hash_expires_at_idx
  ON submission_rate_limits (key_hash, expires_at);

CREATE INDEX IF NOT EXISTS submission_rate_limits_expires_at_idx
  ON submission_rate_limits (expires_at);
