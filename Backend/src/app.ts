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

app.listen(PORT, () => {
  console.log(`http://localhost:3000/`);
});
