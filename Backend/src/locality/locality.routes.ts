import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './locality.controller.js';
import { sanitizeLocalityInput } from './locality.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeLocalityInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeLocalityInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeLocalityInput, update);
router.delete('/:id', authenticate, requireRole('admin'), remove);