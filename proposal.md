# Propuesta TP DSW

## Grupo
### Integrantes
* 53672 - Fossati, Nicolas
* 53671 - Agusti, Tomas

### Repositorios
* [frontend app](http://hyperlinkToGihubOrGitlab)
* [backend app](http://hyperlinkToGihubOrGitlab) 


## Tema
### Descripción
* Aplicacion web que permite al usuario y al administrador gestionar reservas de viaje eficientemente, brindando la posibilidad de agendar, postergar o cancelar una reserva. La aplicacion permitira al usuario registrarse/loguearse en el sistema para gestionar sus viajes ya agendados, o realizar nuevas reservas indicando datos de origen, destino y fecha del viaje. 

## Modelo de Dominio

<p align="center">
  <a href="https://app.diagrams.net/#G1pX9k6-8A__whxANlIGZZBkMNBzl3rkeK">
    <img src="https://drive.google.com/uc?export=view&id=1pX9k6-8A__whxANlIGZZBkMNBzl3rkeK" alt="Modelo de Dominio"/>
  </a>
</p>



## Alcance Funcional 

### Alcance Mínimo

*Nota*: el siguiente es un ejemplo para un grupo de 3 integrantes para un sistema de hotel. El 

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Reserva<br>2. CRUD Viaje<br>3. CRUD Trayecto<br>4. CRUD Localidad|
|CRUD dependiente|1. CRUD Reserva {depende de} CRUD Viaje|
|Listado<br>+<br>detalle| 1. Listado de reservas filtrado por rango de fecha, muestra fecha de viaje y trayecto, estado de Reserva y nombre del cliente => detalle muestra datos completos de la reserva y del cliente|
|CUU/Epic|1. Registrar una Reserva para viajar<br>2. Cancelar una Reserva|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Reserva<br>2. CRUD Viaje<br>3. CRUD Trayecto<br>4. CRUD Localidad<br>5. CRUD Conductor<br>6. CRUD Vehiculo<br>7. CRUD Usuario|
|CUU/Epic|1. Registrar una Reserva para viajar<br>2. Registrar un Cliente<br>3. Cancelar una Reserva|


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Listado de Viajes filtrados por estado (activos)|
|CUU/Epic||
|Otros|1. Envío de recordatorio de Reserva por email|

