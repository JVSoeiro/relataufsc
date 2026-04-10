CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(191) PRIMARY KEY NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  media_path VARCHAR(1024) NULL,
  media_kind VARCHAR(24) NULL,
  media_mime_type VARCHAR(191) NULL,
  media_size_bytes INT UNSIGNED NULL,
  public_name VARCHAR(191) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at VARCHAR(40) NOT NULL,
  moderated_at VARCHAR(40) NULL,
  approved_at VARCHAR(40) NULL,
  submitter_email VARCHAR(191) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX complaints_status_idx
  ON complaints (status);

CREATE INDEX complaints_campus_status_idx
  ON complaints (campus_id, status);

CREATE INDEX complaints_created_at_idx
  ON complaints (created_at);

CREATE INDEX complaints_campus_created_at_idx
  ON complaints (campus_id, created_at);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  key_hash VARCHAR(128) NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  expires_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX submission_rate_limits_key_hash_expires_at_idx
  ON submission_rate_limits (key_hash, expires_at);

CREATE INDEX submission_rate_limits_expires_at_idx
  ON submission_rate_limits (expires_at);
