import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  login,
  logout,
  resetPassword,
  reactivate,
} from './client.controller.js';
import { sanitizeClientInput } from './client.validation.js';
import {
  authenticate,
  requireRole,
  requireSelfOrAdmin,
} from '../middleware/auth.middleware.js';

export const router = Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/reset-password', resetPassword);
router.post('/:id/reactivate', authenticate, requireRole('admin'), reactivate);
router.get('/inactive', authenticate, requireRole('admin'), findAllInactive);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeClientInput, add);
router.put('/:id', authenticate, requireSelfOrAdmin, sanitizeClientInput, update);
router.patch('/:id', authenticate, requireSelfOrAdmin, sanitizeClientInput, update);
router.delete('/:id', authenticate, requireSelfOrAdmin, remove);