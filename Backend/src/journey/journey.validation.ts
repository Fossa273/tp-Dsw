import { Request, Response, NextFunction } from 'express';

function sanitizeJourneyInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    originId: req.body.originId,
    destinationId: req.body.destinationId,
    distanceKm: req.body.distanceKm,
    durationMinutes: req.body.durationMinutes,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeJourneyInput };