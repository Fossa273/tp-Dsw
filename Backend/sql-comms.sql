create database if not exists empresaviaje;
use empresaviaje;
create user if not exists dsw@'%' identified by 'dsw';
grant select, update, insert, delete on empresaviaje.* to dsw@'%';

-- Tabla clientes
create table if not exists `empresaviaje`.`clientes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  `apellido` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `telefono` VARCHAR(255) NULL,
  `activo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`));
insert into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('1', 'Juan', 'Perez', 'juan@example.com', '1234567890', 1);
insert into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321', 1);
insert into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455', 1);
insert into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899', 1);
insert into empresaviaje.clientes (id, nombre, apellido, email, telefono, activo) values('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655', 1);

-- Tabla localidades
create table if not exists `empresaviaje`.`localidades` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
  insert into empresaviaje.localidades values('1', 'CABA');
  insert into empresaviaje.localidades values('2', 'La Plata');
  insert into empresaviaje.localidades values('3', 'Mar del Plata');
  insert into empresaviaje.localidades values('4', 'Rosario');
  insert into empresaviaje.localidades values('5', 'San Miguel de Tucumán');
  insert into empresaviaje.localidades values('6', 'Bariloche');

-- Tabla provincias
Create table if not exists `empresaviaje`.`provincias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));
  insert into empresaviaje.provincias values('1', 'Buenos Aires');
  insert into empresaviaje.provincias values('2', 'Córdoba');
  insert into empresaviaje.provincias values('3', 'Santa Fe');
  insert into empresaviaje.provincias values('4', 'Mendoza');
  insert into empresaviaje.provincias values('5', 'Tucumán');

-- Tabla vehiculos
Create table if not exists `empresaviaje`.`vehiculos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `capacidadmax` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`));
  insert into empresaviaje.vehiculos values('1', 45);
  insert into empresaviaje.vehiculos values('2', 30);
  insert into empresaviaje.vehiculos values('3', 60);
  insert into empresaviaje.vehiculos values('4', 20);
  insert into empresaviaje.vehiculos values('5', 50);

-- Migracion: agregar columna activo a clientes (para baja logica)
-- Ejecutar solo si la tabla ya existe sin la columna activo
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
