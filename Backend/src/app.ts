import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { router as clientRoutes } from './client/client.routes.js';
import { router as localityRoutes } from './locality/locality.routes.js';
import { router as provinceRoutes } from './province/province.routes.js';
import { router as vehicleRoutes } from './vehicle/vehicle.routes.js';

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

app.use('/api/clients', clientRoutes);
app.use('/api/localities', localityRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler: always responds with JSON
// (otherwise Express returns an HTML page and the frontend
// fails with "Unexpected token '<'").
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err?.message ?? err);

  if (err && err.code === 'ECONNREFUSED') {
    res.status(503).json({
      error:
        'No se pudo conectar con la base de datos MySQL. Verifique que el servicio este iniciado.',
    });
    return;
  }
  if (err && err.code === 'ER_NO_SUCH_TABLE') {
    res.status(500).json({
      error:
        'Falta una tabla en la base de datos. Ejecute Backend/seed.sql para inicializarla.',
    });
    return;
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      error: 'Ya existe un registro con ese identificador o email.',
    });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`http://localhost:3000/`);
});