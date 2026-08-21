-- ============================================================
-- EmpresaViaje - Script de inicializacion de base de datos
-- Es IDEMPOTENTE: puede ejecutarse todas las veces que se
-- quiera sin romper datos existentes (usa IF NOT EXISTS /
-- INSERT IGNORE / migraciones condicionales).
--
-- Ejecutar con:
--   mysql -u root -proot < sql-comms.sql
-- ============================================================

create database if not exists empresaviaje;
use empresaviaje;
create user if not exists dsw@'%' identified by 'dsw';
grant select, update, insert, delete on empresaviaje.* to dsw@'%';

-- ------------------------------------------------------------
-- Tabla clientes
-- ------------------------------------------------------------
create table if not exists `empresaviaje`.`clientes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  `apellido` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `telefono` VARCHAR(255) NULL,
  `activo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`));

-- Migracion: agregar columna activo a clientes (baja logica)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'empresaviaje'
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'activo'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `empresaviaje`.`clientes` ADD COLUMN `activo` TINYINT NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migracion: agregar columna dni a clientes
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'empresaviaje'
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'dni'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `empresaviaje`.`clientes` ADD COLUMN `dni` VARCHAR(255) NULL AFTER `apellido`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migracion: agregar columna password a clientes (login)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'empresaviaje'
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'password'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `empresaviaje`.`clientes` ADD COLUMN `password` VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migracion: agregar columna logged a clientes (sesion)
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'empresaviaje'
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'logged'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE `empresaviaje`.`clientes` ADD COLUMN `logged` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migracion: email unico para poder hacer login
SET @index_exists = (
  SELECT COUNT(DISTINCT INDEX_NAME)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'empresaviaje'
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME = 'email'
    AND NON_UNIQUE = 0
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE `empresaviaje`.`clientes` ADD UNIQUE INDEX `uq_clientes_email` (`email`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Datos iniciales (INSERT IGNORE: no duplica si ya existen)
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('1', 'Juan', 'Perez', 'juan@example.com', '1234567890', 1);
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321', 1);
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455', 1);
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899', 1);
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655', 1);

-- ------------------------------------------------------------
-- Administrador: cliente con id = 0
-- Para que MySQL inserte el id 0 en una columna AUTO_INCREMENT
-- hay que habilitar NO_AUTO_VALUE_ON_ZERO (si no, genera otro id).
-- Password por defecto: admin123 (se guarda hasheada en sha256:
-- 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
-- ------------------------------------------------------------
SET @old_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = CONCAT('NO_AUTO_VALUE_ON_ZERO,', @old_sql_mode);
insert ignore into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo, password, logged)
values (0, 'Admin', 'RutaBus', 'admin@rutabus.com', '0000000000', 1,
        '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 0);
SET SESSION sql_mode = @old_sql_mode;

-- Si el admin ya existia sin password, se la asignamos
update empresaviaje.clientes
set password = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
where id = 0 and (password is null or password = '');

-- ------------------------------------------------------------
-- Tabla localidades
-- ------------------------------------------------------------
create table if not exists `empresaviaje`.`localidades` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
insert ignore into empresaviaje.localidades values('1', 'CABA');
insert ignore into empresaviaje.localidades values('2', 'La Plata');
insert ignore into empresaviaje.localidades values('3', 'Mar del Plata');
insert ignore into empresaviaje.localidades values('4', 'Rosario');
insert ignore into empresaviaje.localidades values('5', 'San Miguel de Tucumán');
insert ignore into empresaviaje.localidades values('6', 'Bariloche');

-- ------------------------------------------------------------
-- Tabla provincias (columna nombreprov, igual que la entidad)
-- ------------------------------------------------------------
create table if not exists `empresaviaje`.`provincias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombreprov` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
insert ignore into empresaviaje.provincias values('1', 'Buenos Aires');
insert ignore into empresaviaje.provincias values('2', 'Córdoba');
insert ignore into empresaviaje.provincias values('3', 'Santa Fe');
insert ignore into empresaviaje.provincias values('4', 'Mendoza');
insert ignore into empresaviaje.provincias values('5', 'Tucumán');

-- ------------------------------------------------------------
-- Tabla vehiculos
-- ------------------------------------------------------------
create table if not exists `empresaviaje`.`vehiculos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capacidadmax` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`));
insert ignore into empresaviaje.vehiculos values('1', 45);
insert ignore into empresaviaje.vehiculos values('2', 30);
insert ignore into empresaviaje.vehiculos values('3', 60);
insert ignore into empresaviaje.vehiculos values('4', 20);
insert ignore into empresaviaje.vehiculos values('5', 50);
