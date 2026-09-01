import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './journey.controller.js';
import { sanitizeJourneyInput } from './journey.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeJourneyInput, add);
router.put('/:id', sanitizeJourneyInput, update);
router.patch('/:id', sanitizeJourneyInput, update);
router.delete('/:id', remove);