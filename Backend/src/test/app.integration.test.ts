import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { ApiError } from '../shared/api-error.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import express from 'express';

describe('API integration', () => {
  it('responde correctamente al health check', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.databaseConfigured).toBe(true);
  });

  it('rechaza una ruta protegida sin autenticacion', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Debe autenticarse para realizar esta operacion',
    });
  });

  it('devuelve un error JSON para rutas inexistentes', async () => {
    const response = await request(app).get('/api/ruta-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'La ruta solicitada no existe.',
    });
  });

  it('centraliza los errores de negocio con el middleware', async () => {
    const miniApp = express();
    miniApp.get('/test-error', (_req, _res, next) => {
      next(
        new ApiError(
          409,
          'La provincia no puede eliminarse porque tiene localidades asociadas'
        )
      );
    });
    miniApp.use(errorMiddleware);

    const response = await request(miniApp).get('/test-error');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'La provincia no puede eliminarse porque tiene localidades asociadas',
    });
  });
});
