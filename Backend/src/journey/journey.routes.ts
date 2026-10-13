import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  reactivate,
} from './journey.controller.js';
import { sanitizeJourneyInput } from './journey.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.get('/', findAll);
router.get('/inactive', authenticate, requireRole('admin'), findAllInactive);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeJourneyInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeJourneyInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeJourneyInput, update);
router.delete('/:id', authenticate, requireRole('admin'), remove);
router.post('/:id/reactivate', authenticate, requireRole('admin'), reactivate);