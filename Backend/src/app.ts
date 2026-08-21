import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { router as clienteRoutes } from './cliente/cliente.routes.js';
import { router as localidadRoutes } from './localidad/localidad.routes.js';
import { router as provinciaRoutes } from './provincia/provincia.routes.js';
import { router as vehiculoRoutes } from './vehiculo/vehiculo.routes.js';

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

app.use('/api/clientes', clienteRoutes);
app.use('/api/localidades', localidadRoutes);
app.use('/api/provincias', provinciaRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores: siempre responde JSON
// (sin esto, Express devuelve una pagina HTML y el front
// falla con "Unexpected token '<'").
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

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
        'Falta una tabla en la base de datos. Ejecute Backend/sql-comms.sql para inicializarla.',
    });
    return;
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      error: 'Ya existe un registro con ese identificador o email.',
    });
    return;
  }

  res.status(500).json({ error: err?.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`http://localhost:3000/`);
});
