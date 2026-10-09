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
import {
  bookingEmailUpload,
  deleteAttachment,
  getTemplate,
  updateTemplate,
} from './booking-email.controller.js';

export const router = Router();

router.get('/seats', seatsByTrips);
router.get('/email-template', getTemplate);
router.put('/email-template', bookingEmailUpload.array('attachments', 5), updateTemplate);
router.delete('/email-template/attachments/:id', deleteAttachment);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeBookingInput, add);
router.put('/:id', sanitizeBookingInput, update);
router.patch('/:id', sanitizeBookingInput, update);
router.post('/:id/cancel', cancel);
router.delete('/:id', remove);
