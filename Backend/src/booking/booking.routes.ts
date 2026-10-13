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
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.get('/seats', seatsByTrips);
router.get('/email-template', authenticate, requireRole('admin'), getTemplate);
router.put('/email-template', authenticate, requireRole('admin'), bookingEmailUpload.array('attachments', 5), updateTemplate);
router.delete('/email-template/attachments/:id', authenticate, requireRole('admin'), deleteAttachment);
router.get('/', authenticate, findAll);
router.get('/:id', authenticate, findOne);
router.post('/', sanitizeBookingInput, add);
router.put('/:id', authenticate, sanitizeBookingInput, update);
router.patch('/:id', authenticate, sanitizeBookingInput, update);
router.post('/:id/cancel', authenticate, cancel);
router.delete('/:id', authenticate, remove);
