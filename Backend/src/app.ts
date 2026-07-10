import express, { NextFunction, Request, Response } from 'express';
import { router as clienteRoutes } from './cliente/cliente.routes.js';

const app = express();
const PORT = 3000;
app.use(express.json());

app.use('/api/clientes', clienteRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`http://localhost:3000/`);
});
