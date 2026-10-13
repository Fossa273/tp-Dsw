# Tracking de features, bugs e issues

Estado del proyecto al 13/10/2026. Los estados se basan en la revisión del
código presente en el repositorio y deben actualizarse cuando se incorporen
nuevos cambios o evidencias.

## Estados

- **Completado:** implementado y verificado en el código.
- **En progreso:** parcialmente implementado o pendiente de validación.
- **Pendiente:** todavía no implementado.
- **Bloqueado:** requiere una decisión, recurso o información externa.

## Features

| ID    | Feature                                           | Estado      | Prioridad | Responsable | Evidencia                                                                                 |
| ----- | ------------------------------------------------- | ----------- | --------- | ----------- | ----------------------------------------------------------------------------------------- |
| F-001 | CRUD de provincias                                | Completado  | Alta      | Equipo      | [ProvincesPage.jsx](../Frontend/app/src/pages/ProvincesPage.jsx) y API de provincias      |
| F-002 | CRUD de vehículos                                 | Completado  | Alta      | Equipo      | [VehiclesPage.jsx](../Frontend/app/src/pages/VehiclesPage.jsx) y API de vehículos         |
| F-003 | CRUD de clientes                                  | Completado  | Alta      | Equipo      | [ClientsPage.jsx](../Frontend/app/src/pages/ClientsPage.jsx) y API de clientes            |
| F-004 | CRUD de localidades                               | Completado  | Alta      | Equipo      | [LocalitiesPage.jsx](../Frontend/app/src/pages/LocalitiesPage.jsx) y API de localidades   |
| F-005 | CRUD de conductores                               | Completado  | Alta      | Equipo      | [DriversPage.jsx](../Frontend/app/src/pages/DriversPage.jsx) y API de conductores         |
| F-006 | CRUD de trayectos                                 | Completado  | Alta      | Equipo      | [JourneysPage.jsx](../Frontend/app/src/pages/JourneysPage.jsx) y API de trayectos         |
| F-007 | CRUD de viajes                                    | Completado  | Alta      | Equipo      | [TripsPage.jsx](../Frontend/app/src/pages/TripsPage.jsx) y API de viajes                  |
| F-008 | CRUD de reservas                                  | Completado  | Alta      | Equipo      | [BookingsPage.jsx](../Frontend/app/src/pages/BookingsPage.jsx) y API de reservas          |
| F-009 | Categorías e histórico de precios                 | Completado  | Media     | Equipo      | [VehicleCategoriesPage.jsx](../Frontend/app/src/pages/VehicleCategoriesPage.jsx)          |
| F-010 | Login de cliente y administrador                  | En progreso | Alta      | Equipo      | [AuthContext.jsx](../Frontend/app/src/context/AuthContext.jsx)                            |
| F-011 | Protección de rutas del frontend por rol          | Completado  | Alta      | Equipo      | [App.jsx](../Frontend/app/src/App.jsx)                                                    |
| F-012 | Protección de rutas API por rol                   | Pendiente   | Alta      | Equipo      | Requiere middleware de autenticación/autorización en backend                              |
| F-013 | Listado de reservas con filtro por rango de fecha | Completado  | Alta      | Equipo      | [BookingsPage.jsx](../Frontend/app/src/pages/BookingsPage.jsx)                            |
| F-014 | Detalle completo de reserva y cliente             | Completado  | Alta      | Equipo      | Modal de detalle en [BookingsPage.jsx](../Frontend/app/src/pages/BookingsPage.jsx)        |
| F-015 | Búsqueda de viajes por trayecto y fecha           | Completado  | Alta      | Equipo      | `GET /api/trips/search` y [SearchForm.jsx](../Frontend/app/src/components/SearchForm.jsx) |
| F-016 | Cancelación de reservas                           | Completado  | Alta      | Equipo      | `POST /api/bookings/:id/cancel`                                                           |
| F-017 | Precio dinámico por viaje                         | Completado  | Media     | Equipo      | Cálculo en controlador de viajes y reservas                                               |
| F-018 | Email de confirmación y plantilla configurable    | Completado  | Media     | Equipo      | [booking-email.service.ts](../Backend/src/booking/booking-email.service.ts)               |
| F-019 | Datos demo para probar paginación                 | Completado  | Media     | Equipo      | [seed.ts](../Backend/prisma/seed.ts)                                                      |
| F-020 | Documentación de instalación                      | Completado  | Media     | Equipo      | [README.md](./README.md)                                                                  |
| F-021 | Documentación de API                              | Completado  | Media     | Equipo      | [api.md](./doc-api/api.md)                                                                |
| F-022 | Reprogramación de reservas                        | Pendiente   | Baja      | Equipo      | Definido como alcance adicional/voluntario                                                |

## Bugs corregidos

| ID    | Bug                                                                                   | Estado     | Prioridad | Solución o evidencia                                                                                         |
| ----- | ------------------------------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| B-001 | Las respuestas no JSON del backend podían provocar errores poco claros en el frontend | Completado | Alta      | El servicio API detecta el `content-type` y muestra un error amigable                                        |
| B-002 | Faltaban datos de DNI y teléfono del cliente en el detalle de reserva                 | Completado | Alta      | La relación de cliente fue ampliada en [booking.repository.ts](../Backend/src/booking/booking.repository.ts) |
| B-003 | La lista de reservas no permitía filtrar por rango de fecha de viaje                  | Completado | Alta      | Se agregaron filtros desde/hasta en [BookingsPage.jsx](../Frontend/app/src/pages/BookingsPage.jsx)           |
| B-004 | La seed no tenía suficientes datos para comprobar la paginación                       | Completado | Media     | Se agregaron clientes, localidades, trayectos, viajes y reservas en [seed.ts](../Backend/prisma/seed.ts)     |

## Bugs conocidos

| ID    | Bug o riesgo                                                                                       | Estado  | Prioridad | Impacto                                                                               |
| ----- | -------------------------------------------------------------------------------------------------- | ------- | --------- | ------------------------------------------------------------------------------------- |
| B-005 | La autorización se controla en el frontend, pero las rutas API no tienen autenticación persistente | Abierto | Crítica   | Un cliente podría intentar llamar directamente a endpoints administrativos            |
| B-006 | No existen tests automatizados en el repositorio                                                   | Abierto | Alta      | No hay evidencia automatizada de regresión para backend, frontend ni flujos completos |

## Issues y tareas pendientes

| ID    | Issue                                                                 | Estado    | Prioridad | Próximo paso                                                 |
| ----- | --------------------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------ |
| I-001 | Agregar tests unitarios de backend para cumplir la aprobación directa | Pendiente | Alta      | Incorporar Jest y cubrir reglas de reservas/precios          |
| I-002 | Agregar un test de integración de API                                 | Pendiente | Alta      | Incorporar Supertest y probar un flujo de reserva            |
| I-003 | Agregar test unitario de componente React                             | Pendiente | Alta      | Incorporar Vitest y React Testing Library                    |
| I-004 | Agregar test end-to-end                                               | Pendiente | Alta      | Incorporar Playwright y cubrir login + consulta/reserva      |
| I-005 | Implementar autenticación y autorización en backend                   | Pendiente | Crítica   | Definir sesión o JWT y middleware por rol                    |
| I-006 | Incorporar evidencia de ejecución de tests                            | Pendiente | Alta      | Guardar resultados y comandos en la documentación de entrega |
| I-007 | Documentar PR/MR reales                                               | Pendiente | Media     | Agregar enlaces cuando estén creados en GitHub               |
| I-008 | Completar evidencia visual responsive en SM, MD y LG                  | Pendiente | Media     | Capturar y documentar la ejecución en los tres breakpoints   |
| I-009 | Evaluar implementación de reprogramación de reservas                  | Pendiente | Baja      | Definir reglas de negocio, endpoint y pantalla               |

## Historial de actualización

| Fecha      | Cambio                                                  |
| ---------- | ------------------------------------------------------- |
| 13/10/2026 | Se crea el tracking inicial de features, bugs e issues. |
