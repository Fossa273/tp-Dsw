import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  findPromoted,
  update,
  add,
  remove,
  reactivate,
  search,
} from './trip.controller.js';
import { sanitizeTripInput } from './trip.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

// Inactive trips (must come before /:id to avoid route collision).
router.get('/inactive', authenticate, requireRole('admin'), findAllInactive);
router.get('/promoted', findPromoted);
router.get('/search', search);

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeTripInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeTripInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeTripInput, update);
router.post('/:id/reactivate', authenticate, requireRole('admin'), reactivate);
router.delete('/:id', authenticate, requireRole('admin'), remove);