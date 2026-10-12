-- Additive and repeatable upgrade for the earlier Users/Jobs schema.
-- Back up a deployed database first. Run one migration process at a time.
-- MariaDB DDL commits implicitly, so do not expect transaction rollback for this file.
ALTER TABLE Jobs
  ADD COLUMN IF NOT EXISTS strCustomerName VARCHAR(100) NOT NULL DEFAULT 'Existing customer',
  ADD COLUMN IF NOT EXISTS strEmail VARCHAR(254) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS strCompany VARCHAR(150) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS strService VARCHAR(40) NOT NULL DEFAULT 'multidisciplinary',
  ADD COLUMN IF NOT EXISTS strDetails TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dteExpectedCompletion DATE NULL;

ALTER TABLE Jobs
  ADD INDEX IF NOT EXISTS jobs_assigned_user_id_created_at (AssignedUserId, CreatedAt);
