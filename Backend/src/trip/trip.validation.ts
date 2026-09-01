import { Request, Response, NextFunction } from 'express';

function sanitizeTripInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    journeyId: req.body.journeyId,
    driverId: req.body.driverId,
    vehicleId: req.body.vehicleId,
    departureDate: req.body.departureDate,
    arrivalDate: req.body.arrivalDate,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeTripInput };