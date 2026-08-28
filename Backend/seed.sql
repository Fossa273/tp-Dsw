-- ============================================================
-- RutaBus - Database initialization script
-- IDEMPOTENT: it can be run as many times as needed without
-- breaking existing data (uses IF NOT EXISTS / INSERT IGNORE
-- / conditional migrations).
--
-- Run with:
--   mysql -u root -proot --default-character-set=utf8mb4 < seed.sql
-- ============================================================

-- Ensure utf8mb4 so accented characters (e.g. Córdoba) are not
-- stored as mojibake.
SET NAMES utf8mb4;

create database if not exists rutabus
  character set utf8mb4
  collate utf8mb4_unicode_ci;
use rutabus;

create user if not exists dsw@'%' identified by 'dsw';
grant select, update, insert, delete on rutabus.* to dsw@'%';

-- ------------------------------------------------------------
-- Table clients
-- ------------------------------------------------------------
create table if not exists `rutabus`.`clients` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(255) NULL,
  `lastName` VARCHAR(255) NULL,
  `dni` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  `password` VARCHAR(255) NULL,
  `logged` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_clients_email` (`email`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: add column active (logical deletion)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'active'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `rutabus`.`clients` ADD COLUMN `active` TINYINT NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migration: add column dni
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'dni'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `rutabus`.`clients` ADD COLUMN `dni` VARCHAR(255) NULL AFTER `lastName`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migration: add column password (login)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'password'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `rutabus`.`clients` ADD COLUMN `password` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migration: add column logged (session)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'logged'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `rutabus`.`clients` ADD COLUMN `logged` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migration: unique email so login works
SET @index_exists = (
  SELECT COUNT(DISTINCT INDEX_NAME)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'clients'
    AND COLUMN_NAME = 'email'
    AND NON_UNIQUE = 0
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE `rutabus`.`clients` ADD UNIQUE INDEX `uq_clients_email` (`email`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed clients (INSERT IGNORE: no duplicates if already present)
-- Passwords are stored as SHA-256 hex hashes. The seed values are:
--   admin@rutabus.com     / admin123
--   juan@example.com      / cliente123
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active) values('1', 'Juan', 'Perez', '30123456', 'juan@example.com', '1234567890', 1);
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active) values('2', 'Juana', 'Gonzalez', '30234567', 'maria@example.com', '0987654321', 1);
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active) values('3', 'Pedro', 'Rodriguez', '30345678', 'pedro@example.com', '1122334455', 1);
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active) values('4', 'Ana', 'Lopez', '30456789', 'ana@example.com', '5566778899', 1);
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active) values('5', 'Luis', 'Martinez', '30567890', 'luis@example.com', '9988776655', 1);

-- Demo user with a known password so regular-login can be tested
update rutabus.clients
set password = '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9'
where id = 1 and (password is null or password = '');

-- ------------------------------------------------------------
-- Administrator: client with id = 0
-- MySQL only stores 0 in an AUTO_INCREMENT column when
-- NO_AUTO_VALUE_ON_ZERO is enabled (otherwise it generates
-- another id).
-- Password: admin123 (SHA-256:
-- 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
-- ------------------------------------------------------------
SET @old_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = CONCAT('NO_AUTO_VALUE_ON_ZERO,', @old_sql_mode);
insert ignore into rutabus.clients (id, firstName, lastName, dni, email, phone, active, password, logged)
values (0, 'Admin', 'RutaBus', NULL, 'admin@rutabus.com', '0000000000', 1,
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 0);
SET SESSION sql_mode = @old_sql_mode;

-- If the admin already existed without a password, set it
update rutabus.clients
set password = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
where id = 0 and (password is null or password = '');

-- ------------------------------------------------------------
-- Table localities
-- ------------------------------------------------------------
create table if not exists `rutabus`.`localities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
insert ignore into rutabus.localities values('1', 'CABA');
insert ignore into rutabus.localities values('2', 'La Plata');
insert ignore into rutabus.localities values('3', 'Mar del Plata');
insert ignore into rutabus.localities values('4', 'Rosario');
insert ignore into rutabus.localities values('5', 'San Miguel de Tucumán');
insert ignore into rutabus.localities values('6', 'Bariloche');

-- ------------------------------------------------------------
-- Table provinces
-- ------------------------------------------------------------
create table if not exists `rutabus`.`provinces` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
insert ignore into rutabus.provinces values('1', 'Buenos Aires');
insert ignore into rutabus.provinces values('2', 'Córdoba');
insert ignore into rutabus.provinces values('3', 'Santa Fe');
insert ignore into rutabus.provinces values('4', 'Mendoza');
insert ignore into rutabus.provinces values('5', 'Tucumán');

-- ------------------------------------------------------------
-- Table vehicles
-- ------------------------------------------------------------
create table if not exists `rutabus`.`vehicles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `maxCapacity` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
insert ignore into rutabus.vehicles values('1', 45);
insert ignore into rutabus.vehicles values('2', 30);
insert ignore into rutabus.vehicles values('3', 60);
insert ignore into rutabus.vehicles values('4', 20);
insert ignore into rutabus.vehicles values('5', 50);

-- ------------------------------------------------------------
-- Table drivers
-- ------------------------------------------------------------
create table if not exists `rutabus`.`drivers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(255) NULL,
  `firstName` VARCHAR(255) NULL,
  `lastName` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_drivers_dni` (`dni`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: add column active (logical deletion)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'rutabus'
    AND TABLE_NAME = 'drivers'
    AND COLUMN_NAME = 'active'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `rutabus`.`drivers` ADD COLUMN `active` TINYINT NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed drivers (INSERT IGNORE: no duplicates if already present)
insert ignore into rutabus.drivers (dni, firstName, lastName, phone, active) values('30123456', 'Carlos', 'Gutierrez', '1112223334', 1);
insert ignore into rutabus.drivers (dni, firstName, lastName, phone, active) values('30234567', 'Marta', 'Sosa', '2223334445', 1);
insert ignore into rutabus.drivers (dni, firstName, lastName, phone, active) values('30345678', 'Jorge', 'Fernandez', '3334445556', 1);
insert ignore into rutabus.drivers (dni, firstName, lastName, phone, active) values('30456789', 'Silvia', 'Ramos', '4445556667', 1);
insert ignore into rutabus.drivers (dni, firstName, lastName, phone, active) values('30567890', 'Diego', 'Alvarez', '5556667778', 1);