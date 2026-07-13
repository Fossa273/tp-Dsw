create database if not exists empresaviaje;

use empresaviaje;


create user if not exists dsw@'%' identified by 'dsw';
grant select, update, insert, delete on empresaviaje.* to dsw@'%';


create table if not exists `empresaviaje`.`clientes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NULL,
  `apellido` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `telefono` VARCHAR(255) NULL,
  PRIMARY KEY (`id`));


insert into empresaviaje.clientes values('1', 'Juan', 'Perez', 'juan@example.com', '1234567890');
insert into empresaviaje.clientes values('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321');
insert into empresaviaje.clientes values('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455');
insert into empresaviaje.clientes values('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899');
insert into empresaviaje.clientes values('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655');
