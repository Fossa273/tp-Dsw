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
    dayOfWeek: req.body.dayOfWeek,
    departureTime: req.body.departureTime,
    arrivalTime: req.body.arrivalTime,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeTripInput };