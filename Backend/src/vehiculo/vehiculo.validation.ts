import { Request, Response, NextFunction } from 'express';

function sanitizeVehiculoInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    capacidadmax: req.body.capacidadmax,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeVehiculoInput };
