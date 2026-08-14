import { Request, Response, NextFunction } from 'express';

function sanitizeLocalidadInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    cp: req.body.cp,
    nombreloc: req.body.nombreloc,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}
export { sanitizeLocalidadInput };
