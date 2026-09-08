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

export const router = Router();

router.get('/', findAll);
router.get('/inactive', findAllInactive);
router.get('/:id', findOne);
router.post('/', sanitizeJourneyInput, add);
router.put('/:id', sanitizeJourneyInput, update);
router.patch('/:id', sanitizeJourneyInput, update);
router.delete('/:id', remove);
router.post('/:id/reactivate', reactivate);