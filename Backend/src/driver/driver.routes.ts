import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  reactivate,
} from './driver.controller.js';
import { sanitizeDriverInput } from './driver.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.post('/:id/reactivate', authenticate, requireRole('admin'), reactivate);
router.get('/inactive', authenticate, requireRole('admin'), findAllInactive);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeDriverInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeDriverInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeDriverInput, update);
router.delete('/:id', authenticate, requireRole('admin'), remove);
