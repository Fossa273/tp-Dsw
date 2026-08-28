import { Request, Response, NextFunction } from 'express';

function sanitizeVehicleInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    maxCapacity: req.body.maxCapacity,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeVehicleInput };