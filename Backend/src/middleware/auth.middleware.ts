import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

export type AuthRole = 'admin' | 'client';

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
};

const JWT_SECRET = process.env.JWT_SECRET ?? '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio para iniciar el backend');
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;
  if (!token) {
    res.status(401).json({ error: 'Debe autenticarse para realizar esta operacion' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.id !== 'number' ||
      typeof payload.email !== 'string' ||
      (payload.role !== 'admin' && payload.role !== 'client')
    ) {
      throw new Error('Payload JWT invalido');
    }
    req.user = payload as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

export function requireRole(role: AuthRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'No tiene permisos para realizar esta operacion' });
      return;
    }
    next();
  };
}

export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  const requestedId = Number(req.params.id);
  if (req.user?.role === 'admin' || req.user?.id === requestedId) {
    next();
    return;
  }
  res.status(403).json({ error: 'No tiene permisos para modificar este cliente' });
}

export function signAuthToken(user: AuthUser) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as SignOptions['expiresIn'],
  };
  return jwt.sign(user, JWT_SECRET, options);
}
