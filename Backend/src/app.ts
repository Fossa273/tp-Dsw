import express, { NextFunction, Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import { Prisma } from '@prisma/client';
import { router as clientRoutes } from './client/client.routes.js';
import { router as localityRoutes } from './locality/locality.routes.js';
import { router as provinceRoutes } from './province/province.routes.js';
import { router as vehicleRoutes } from './vehicle/vehicle.routes.js';
import { router as vehicleCategoryRoutes } from './vehicle-category/vehicle-category.routes.js';
import { router as driverRoutes } from './driver/driver.routes.js';
import { router as journeyRoutes } from './journey/journey.routes.js';
import { router as tripRoutes } from './trip/trip.routes.js';
import { router as bookingRoutes } from './booking/booking.routes.js';
import { prisma } from './shared/db/connection.js';
import { PORT } from './shared/constants.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clients', clientRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/localities', localityRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle-categories', vehicleCategoryRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler: always responds with JSON
// (otherwise Express returns an HTML page and the frontend
// fails with "Unexpected token '<'").
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err?.message ?? err);

  // Driver-adapter connection failure (ECONNREFUSED / unable to connect)
  if (err && (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR')) {
    res.status(503).json({
      error:
        'No se pudo conectar con la base de datos MySQL. Verifique que el servicio este iniciado.',
    });
    return;
  }

  // Prisma unique constraint violation (e.g. duplicate email / dni)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const targetValue = err.meta?.target;
    const target = Array.isArray(targetValue) ? targetValue.join(',') : '';
    res.status(409).json({
      error: target.includes('originId') && target.includes('destinationId')
        ? 'Ya existe un trayecto con ese origen y destino, aunque puede estar dado de baja. Revise los trayectos inactivos.'
        : 'Ya existe un registro con ese identificador o email.',
    });
    return;
  }

  // Prisma record not found (update/delete on a non-existent row)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Registro no encontrado.' });
    return;
  }

  // Prisma foreign key constraint violation (delete of a referenced record)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    res.status(409).json({
      error: 'No se puede realizar esta operacion porque existen registros dependientes.',
    });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/`);
});

const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server stopped.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);