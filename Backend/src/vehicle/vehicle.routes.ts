import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './vehicle.controller.js';
import { sanitizeVehicleInput } from './vehicle.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeVehicleInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeVehicleInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeVehicleInput, update);
router.delete('/:id', authenticate, requireRole('admin'), remove);