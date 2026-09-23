-- Run once:  mysql -u root -p < server/schema.sql
CREATE DATABASE IF NOT EXISTS reg_and_log CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reg_and_log;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(161) NOT NULL, -- "salt:hash" = 32 + 1 + 128 hex characters
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
