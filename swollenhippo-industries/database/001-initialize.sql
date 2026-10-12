-- Run against an existing, selected MariaDB database (utf8mb4).
-- Preserve the team's physical table/column names and foreign-key relationship.
-- Credentials are created with the bcrypt-based admin:create command, never in SQL.
CREATE TABLE IF NOT EXISTS Users (
  Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Username VARCHAR(100) NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Role ENUM('Admin', 'Customer') NOT NULL DEFAULT 'Customer',
  PRIMARY KEY (Id),
  UNIQUE KEY users_username (Username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Jobs (
  Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Title VARCHAR(200) NOT NULL DEFAULT 'Project inquiry',
  strCustomerName VARCHAR(100) NOT NULL DEFAULT 'Existing customer',
  strEmail VARCHAR(254) NOT NULL DEFAULT '',
  strCompany VARCHAR(150) NOT NULL DEFAULT '',
  strService VARCHAR(40) NOT NULL DEFAULT 'multidisciplinary',
  strDetails TEXT NOT NULL DEFAULT '',
  Status ENUM('Pending', 'InProgress', 'Complete', 'Shipped') NOT NULL DEFAULT 'Pending',
  dteExpectedCompletion DATE NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  AssignedUserId INT UNSIGNED NULL,
  PRIMARY KEY (Id),
  KEY jobs_assigned_user_id_created_at (AssignedUserId, CreatedAt),
  CONSTRAINT jobs_customer_fk FOREIGN KEY (AssignedUserId) REFERENCES Users(Id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
