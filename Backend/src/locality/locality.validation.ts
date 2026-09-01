import { Request, Response, NextFunction } from 'express';

function sanitizeLocalityInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.body.sanitizeInput = {
    id: req.body.id,
    name: req.body.name,
    provinceId: req.body.provinceId,
  };
  Object.keys(req.body.sanitizeInput).forEach((key) => {
    if (req.body.sanitizeInput[key] === undefined) {
      delete req.body.sanitizeInput[key];
    }
  });
  next();
}
export { sanitizeLocalityInput };