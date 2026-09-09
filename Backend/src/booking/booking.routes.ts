import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
  cancel,
  seatsByTrips,
} from './booking.controller.js';
import { sanitizeBookingInput } from './booking.validation.js';

export const router = Router();

router.get('/seats', seatsByTrips);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeBookingInput, add);
router.put('/:id', sanitizeBookingInput, update);
router.patch('/:id', sanitizeBookingInput, update);
router.post('/:id/cancel', cancel);
router.delete('/:id', remove);
