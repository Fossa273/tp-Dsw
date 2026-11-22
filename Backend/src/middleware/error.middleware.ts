import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/api-error.js';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl}:`,
    err instanceof Error ? err.message : err
  );

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? err.details : {}),
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof err.code === 'string' &&
    err.code.startsWith('LIMIT_')
  ) {
    res.status(400).json({
      error: 'La solicitud excede el limite permitido de archivos o de tamaño',
    });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR')
  ) {
    res.status(503).json({
      error: 'El servicio de datos no esta disponible. Intente nuevamente mas tarde.',
    });
    return;
  }

  const entityMessages: Record<string, string> = {
    '/api/clients': 'No se pudo completar la operacion sobre clientes.',
    '/api/drivers': 'No se pudo completar la operacion sobre conductores.',
    '/api/localities': 'No se pudo completar la operacion sobre localidades.',
    '/api/provinces': 'No se pudo completar la operacion sobre provincias.',
    '/api/vehicles': 'No se pudo completar la operacion sobre vehiculos.',
    '/api/vehicle-categories': 'No se pudo completar la operacion sobre categorias de vehiculo.',
    '/api/journeys': 'No se pudo completar la operacion sobre trayectos.',
    '/api/trips': 'No se pudo completar la operacion sobre viajes.',
    '/api/bookings': 'No se pudo completar la operacion sobre reservas.',
  };
  const entityMessage = Object.entries(entityMessages).find(([path]) =>
    req.originalUrl.startsWith(path)
  )?.[1];

  res.status(500).json({
    error: entityMessage
      ? `${entityMessage} Intente nuevamente.`
      : 'No se pudo completar la operacion solicitada. Intente nuevamente.',
  });
}

export function notFoundMiddleware(req: Request, res: Response) {
  const entityMessages: Record<string, string> = {
    '/api/clients': 'No se encontro el recurso solicitado dentro de clientes.',
    '/api/drivers': 'No se encontro el recurso solicitado dentro de conductores.',
    '/api/localities': 'No se encontro el recurso solicitado dentro de localidades.',
    '/api/provinces': 'No se encontro el recurso solicitado dentro de provincias.',
    '/api/vehicles': 'No se encontro el recurso solicitado dentro de vehiculos.',
    '/api/vehicle-categories': 'No se encontro el recurso solicitado dentro de categorias de vehiculo.',
    '/api/journeys': 'No se encontro el recurso solicitado dentro de trayectos.',
    '/api/trips': 'No se encontro el recurso solicitado dentro de viajes.',
    '/api/bookings': 'No se encontro el recurso solicitado dentro de reservas.',
  };
  const entityMessage = Object.entries(entityMessages).find(([path]) =>
    req.originalUrl.startsWith(path)
  )?.[1];
  res.status(404).json({
    error: entityMessage ?? 'La ruta solicitada no existe.',
  });
}
