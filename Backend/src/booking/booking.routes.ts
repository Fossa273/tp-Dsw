import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './booking.controller.js';
import { sanitizeBookingInput } from './booking.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeBookingInput, add);
router.put('/:id', sanitizeBookingInput, update);
router.patch('/:id', sanitizeBookingInput, update);
router.delete('/:id', remove);