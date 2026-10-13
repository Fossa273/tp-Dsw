# API de RutaBus

Documentación de la API REST del backend de RutaBus.

## Información general

- **Base URL local:** `http://localhost:3000/api`
- **Formato:** JSON, excepto la actualización de la plantilla de email, que usa `multipart/form-data`.
- **CORS:** el origen permitido se configura con `CORS_ORIGIN` y por defecto es `http://localhost:5173`.
- **Health check:** `GET /api/health`
- **Autenticación actual:** el login devuelve los datos de sesión para el frontend, pero la API todavía no utiliza tokens ni middleware de autorización en cada ruta. Esto queda registrado como pendiente para aprobación directa.

## Respuestas y errores

Las respuestas exitosas devuelven JSON. Las colecciones usan normalmente la forma:

```json
{
  "data": []
}
```

Los listados paginados devuelven además:

```json
{
  "data": [],
  "page": 1,
  "limit": 50,
  "total": 80,
  "totalPages": 2
}
```

Los errores se devuelven como:

```json
{
  "error": "Descripción del error"
}
```

Estados utilizados:

- `200 OK`: consulta, actualización o eliminación exitosa.
- `201 Created`: alta exitosa.
- `400 Bad Request`: datos faltantes o inválidos.
- `401 Unauthorized`: credenciales incorrectas.
- `403 Forbidden`: operación no permitida.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: duplicado o registro referenciado.
- `503 Service Unavailable`: base de datos no disponible.
- `500 Internal Server Error`: error inesperado.

## Parámetros comunes

Los endpoints paginados aceptan:

| Parámetro | Tipo | Default | Descripción |
|---|---|---:|---|
| `page` | entero positivo | `1` | Página solicitada. |
| `limit` | entero positivo | `50` | Elementos por página; el backend limita a 100 en clientes y reservas. |

Los endpoints con `:id` esperan un identificador numérico en la URL.

## Health check

### `GET /health`

Verifica que el servidor esté funcionando.

Respuesta:

```json
{
  "status": "ok",
  "timestamp": "2026-10-13T21:00:00.000Z"
}
```

## Clientes

### `GET /clients`

Lista clientes activos. Si se envían `page` o `limit`, devuelve resultado paginado.

### `GET /clients/inactive`

Lista clientes dados de baja lógicamente.

### `GET /clients/:id`

Obtiene un cliente por ID.

### `POST /clients`

Registra un cliente. `email` y `password` son obligatorios.

```json
{
  "firstName": "Ana",
  "lastName": "Lopez",
  "dni": "30456789",
  "email": "ana@example.com",
  "phone": "1161234567",
  "password": "cliente123"
}
```

La contraseña nunca se devuelve en la respuesta.

### `PUT /clients/:id` y `PATCH /clients/:id`

Actualiza los campos enviados:

```json
{
  "firstName": "Ana María",
  "lastName": "Lopez",
  "dni": "30456789",
  "email": "ana@example.com",
  "phone": "1161234567",
  "password": "nueva-clave"
}
```

### `DELETE /clients/:id`

Da de baja un cliente. El administrador no puede eliminarse.

### `POST /clients/:id/reactivate`

Reactiva un cliente dado de baja.

### `POST /clients/login`

Inicia sesión.

```json
{
  "email": "juan@example.com",
  "password": "cliente123"
}
```

### `POST /clients/logout`

```json
{
  "id": 1
}
```

### `POST /clients/reset-password`

Actualiza la contraseña usando el email.

```json
{
  "email": "juan@example.com",
  "password": "nueva-clave"
}
```

## Provincias

### `GET /provinces`

Lista provincias.

### `GET /provinces/:id`

Obtiene una provincia.

### `POST /provinces`

```json
{
  "name": "Buenos Aires"
}
```

### `PUT /provinces/:id`, `PATCH /provinces/:id`

Aceptan el mismo cuerpo que `POST`.

### `DELETE /provinces/:id`

Elimina una provincia si no tiene localidades dependientes.

## Localidades

### `GET /localities`

Lista localidades. Acepta `page` y `limit`.

### `GET /localities/:id`

Obtiene una localidad.

### `POST /localities`

```json
{
  "name": "La Plata",
  "provinceId": 1
}
```

### `PUT /localities/:id`, `PATCH /localities/:id`

Aceptan el mismo cuerpo que `POST`.

### `DELETE /localities/:id`

Elimina una localidad si no tiene trayectos dependientes.

## Trayectos

### `GET /journeys`

Lista trayectos activos. Acepta `page` y `limit`.

### `GET /journeys/inactive`

Lista trayectos dados de baja.

### `GET /journeys/:id`

Obtiene un trayecto con origen, destino y datos calculados.

### `POST /journeys`

```json
{
  "originId": 1,
  "destinationId": 2,
  "distanceKm": 60,
  "durationMinutes": 50
}
```

Si la distancia o duración no se informan, el backend puede calcularlas mediante el servicio de mapas.

### `PUT /journeys/:id`, `PATCH /journeys/:id`

Aceptan los campos de `POST`.

### `DELETE /journeys/:id`

Da de baja un trayecto.

### `POST /journeys/:id/reactivate`

Reactiva un trayecto.

## Conductores

### `GET /drivers`

Lista conductores activos.

### `GET /drivers/inactive`

Lista conductores dados de baja.

### `GET /drivers/:id`

Obtiene un conductor.

### `POST /drivers`

```json
{
  "dni": "30123456",
  "firstName": "Carlos",
  "lastName": "Gutierrez",
  "phone": "1112223334"
}
```

### `PUT /drivers/:id`, `PATCH /drivers/:id`

Aceptan los campos de `POST`.

### `DELETE /drivers/:id`

Da de baja un conductor.

### `POST /drivers/:id/reactivate`

Reactiva un conductor.

## Vehículos

### `GET /vehicles`

Lista vehículos.

### `GET /vehicles/:id`

Obtiene un vehículo.

### `POST /vehicles`

```json
{
  "maxCapacity": 45,
  "categoryId": 2,
  "hasBathroom": false,
  "maintenance": false
}
```

### `PUT /vehicles/:id`, `PATCH /vehicles/:id`

Aceptan los campos de `POST`.

### `DELETE /vehicles/:id`

Elimina un vehículo si no tiene viajes dependientes.

## Categorías y precios

### `GET /vehicle-categories`

Lista categorías con su precio base e historial de precios.

### `PATCH /vehicle-categories/:id/price`

Actualiza el precio base de una categoría.

```json
{
  "precioBase": 18000
}
```

## Viajes

### `GET /trips`

Lista viajes activos. Sin parámetros devuelve `{ "data": [...] }`; con `page` o `limit` devuelve un listado paginado. Cada viaje incluye el precio calculado por persona.

### `GET /trips/inactive`

Lista viajes dados de baja.

### `GET /trips/promoted`

Lista viajes promocionados vigentes.

### `GET /trips/search`

Busca viajes disponibles. Todos los filtros son opcionales:

| Parámetro | Descripción |
|---|---|
| `originId` | ID de la localidad de origen. |
| `destinationId` | ID de la localidad de destino. |
| `date` | Fecha `YYYY-MM-DD`; filtra viajes específicos por fecha o viajes semanales por día de la semana. |

Ejemplo:

`GET /trips/search?originId=1&destinationId=2&date=2026-10-20`

### `GET /trips/:id`

Obtiene el viaje con trayecto, conductor, vehículo, horarios y precio por persona.

### `POST /trips`

Viaje semanal:

```json
{
  "journeyId": 1,
  "driverId": 1,
  "vehicleId": 1,
  "scheduleType": "weekly",
  "dayOfWeek": 1,
  "departureTime": "16:10",
  "arrivalTime": "16:50",
  "isPromoted": false
}
```

Viaje específico:

```json
{
  "journeyId": 1,
  "driverId": 1,
  "vehicleId": 1,
  "scheduleType": "specific",
  "departureDate": "2026-11-10T16:10:00.000Z",
  "arrivalTime": "16:50",
  "isPromoted": true,
  "promoExpiry": "2026-11-09T23:59:59.000Z",
  "promoPrice": 12000
}
```

El backend valida disponibilidad del conductor y vehículo para evitar superposición de viajes.

### `PUT /trips/:id`, `PATCH /trips/:id`

Aceptan los campos de `POST`.

### `DELETE /trips/:id`

Da de baja un viaje.

### `POST /trips/:id/reactivate`

Reactiva un viaje.

## Reservas

### `GET /bookings`

Lista reservas con cliente, viaje, trayecto y pasajeros. Acepta:

| Parámetro | Descripción |
|---|---|
| `clientId` | Filtra las reservas de un cliente. |
| `page` | Página. |
| `limit` | Cantidad por página, máximo 100. |

Ejemplo:

`GET /bookings?clientId=1&page=1&limit=50`

### `GET /bookings/:id`

Obtiene el detalle completo de una reserva.

### `POST /bookings`

Reserva de un cliente:

```json
{
  "clientId": 1,
  "tripId": 1,
  "numSeats": 2,
  "state": "pending"
}
```

Reserva de invitado:

```json
{
  "tripId": 1,
  "numSeats": 1,
  "passengers": [
    {
      "firstName": "Pedro",
      "lastName": "Gomez",
      "dni": "30111222",
      "phone": "1161234567",
      "email": "pedro@example.com"
    }
  ]
}
```

Estados permitidos: `pending`, `confirmed`, `cancelled`. El backend calcula el precio y controla la capacidad del vehículo.

### `PUT /bookings/:id`, `PATCH /bookings/:id`

Actualiza los campos enviados: `clientId`, `tripId`, `numSeats`, `state`, `passengerFirstName`, `passengerLastName`, `passengerDni`, `passengerPhone`, `passengerEmail` y `passengers` cuando corresponda.

### `POST /bookings/:id/cancel`

Cancela una reserva. Para una reserva de cliente, el cuerpo puede incluir:

```json
{
  "clientId": 1
}
```

La operación valida que la reserva pertenezca al cliente y que el viaje no haya finalizado.

### `DELETE /bookings/:id`

Elimina una reserva.

### `GET /bookings/seats?tripIds=1,2,3`

Devuelve la suma de asientos reservados por viaje, excluyendo reservas canceladas.

### `GET /bookings/email-template`

Obtiene la plantilla de confirmación de email.

### `PUT /bookings/email-template`

Usa `multipart/form-data`:

| Campo | Tipo | Descripción |
|---|---|---|
| `subject` | texto | Asunto del email. |
| `body` | texto | Cuerpo del email. |
| `attachments` | archivo, repetible | Hasta 5 archivos adjuntos. |

Variables disponibles en la plantilla: `{{clientName}}`, `{{bookingId}}`, `{{origin}}`, `{{destination}}`, `{{departure}}`, `{{seats}}` y `{{price}}`.

### `DELETE /bookings/email-template/attachments/:id`

Elimina un adjunto de la plantilla.

## Relaciones principales

```text
Province
  └── Locality
        └── Journey (origin/destination)
              └── Trip
                    └── Booking ─── Client
```

Un `Trip` también referencia un `Driver` y un `Vehicle`. Una reserva puede tener pasajeros adicionales para reservas de invitado.

## Ejemplo con curl

```bash
curl http://localhost:3000/api/health

curl "http://localhost:3000/api/trips/search?originId=1&destinationId=2&date=2026-10-20"

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":1,\"tripId\":1,\"numSeats\":2,\"state\":\"pending\"}"
```
