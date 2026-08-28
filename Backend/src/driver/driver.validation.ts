import { Request, Response, NextFunction } from 'express';

function sanitizeDriverInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizeInput = {
    id: req.body.id,
    dni: req.body.dni,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}
export { sanitizeDriverInput };
