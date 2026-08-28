import { Request, Response, NextFunction } from 'express';

function sanitizeClientInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizeInput = {
    id: req.body.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dni: req.body.dni,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}
export { sanitizeClientInput };