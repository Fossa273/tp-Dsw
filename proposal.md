# Propuesta TP DSW

## Grupo
### Integrantes
* 53672 - Fossati, Nicolas
* 53671 - Agusti, Tomas

### Repositorios
* [frontend app](https://github.com/Fossa273/frontend-dsw)
* [backend app](https://github.com/Fossa273/backend-dsw) 


## Tema
### Descripción
* Aplicacion web que permite al usuario y al administrador gestionar reservas de viaje eficientemente, brindando la posibilidad de agendar, postergar o cancelar una reserva. La aplicacion permitira al usuario registrarse/loguearse en el sistema para gestionar sus viajes ya agendados, o realizar nuevas reservas indicando datos de origen, destino y fecha del viaje. 

## Modelo de Dominio

<p align="center">
  <a href="https://drive.google.com/file/d/1pX9k6-8A__whxANlIGZZBkMNBzl3rkeK/view" target="_blank">
    <img src="https://drive.google.com/thumbnail?id=1pX9k6-8A__whxANlIGZZBkMNBzl3rkeK&sz=w1200" 
         alt="Modelo de Dominio" 
         style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
  </a>
</p>

## Alcance Funcional 
### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Reserva<br>2. CRUD Viaje<br>3. CRUD Trayecto<br>4. CRUD Localidad|
|CRUD dependiente|1. CRUD Localidad {depende de} CRUD Provincia<br>2. CRUD Viaje {depende de} CRUD Trayecto|
|Listado<br>+<br>detalle| 1. Listado de reservas filtrado por rango de fecha, muestra fecha de viaje y trayecto, estado de Reserva y nombre del cliente => detalle muestra datos completos de la reserva y del cliente<br>2. Listado de Viajes disponibles Filtrados por Trayecto, muestra Fecha y horario de los Viajes, origen y destino del Trayecto (Para que el Cliente consulte disponibilidad de viajes)|
|CUU/Epic|1. Registrar una Reserva para viajar<br>2. Cancelar una Reserva<br>3. Dar de alta Conductor<br>4. Consultar Viajes disponibles|

Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Reserva<br>2. CRUD Viaje<br>3. CRUD Trayecto<br>4. CRUD Localidad<br>5. CRUD Conductor<br>6. CRUD Vehiculo<br>7. CRUD Usuario|
|CUU/Epic|1. Registrar una Reserva para viajar<br>2. Dar de alta un Cliente<br>3. Cancelar una Reserva<br>4. Dar de alta Viaje<br>5. Dar de alta Conductor<br>5. Consultar Viajes disponibles|

### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Listado de Viajes filtrados por estado (activos)|
|CUU/Epic||Reprogramar una reserva |
|Otros|1. Envío de recordatorio de Reserva|
