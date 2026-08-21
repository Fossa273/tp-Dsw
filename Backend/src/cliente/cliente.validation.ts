import { Request, Response, NextFunction } from 'express';

function sanitizeClienteInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizeInput = {
    id: req.body.id,
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    dni: req.body.dni,
    email: req.body.email,
    telefono: req.body.telefono,
    password: req.body.password,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}
export { sanitizeClienteInput };
