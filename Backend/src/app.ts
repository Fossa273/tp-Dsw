import express from 'express';
import 'dotenv/config';
import cors from 'cors';
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
import {
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/error.middleware.js';
import { ApiError } from './shared/api-error.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new ApiError(
      403,
      'El origen del frontend no esta autorizado para acceder a la API',
      undefined,
      'CORS_ORIGIN_NOT_ALLOWED'
    ));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  });
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

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
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
}