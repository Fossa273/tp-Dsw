import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  reactivate,
} from './trip.controller.js';
import { sanitizeTripInput } from './trip.validation.js';

export const router = Router();

// Inactive trips (must come before /:id to avoid route collision).
router.get('/inactive', findAllInactive);

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeTripInput, add);
router.put('/:id', sanitizeTripInput, update);
router.patch('/:id', sanitizeTripInput, update);
router.post('/:id/reactivate', reactivate);
router.delete('/:id', remove);