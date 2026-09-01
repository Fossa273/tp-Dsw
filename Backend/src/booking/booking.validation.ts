import { Request, Response, NextFunction } from 'express';

function sanitizeBookingInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    clientId: req.body.clientId,
    tripId: req.body.tripId,
    numSeats: req.body.numSeats,
    state: req.body.state,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}

export { sanitizeBookingInput };