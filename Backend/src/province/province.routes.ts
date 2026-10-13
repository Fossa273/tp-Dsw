import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './province.controller.js';
import { sanitizeProvinceInput } from './province.validation.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', authenticate, requireRole('admin'), sanitizeProvinceInput, add);
router.put('/:id', authenticate, requireRole('admin'), sanitizeProvinceInput, update);
router.patch('/:id', authenticate, requireRole('admin'), sanitizeProvinceInput, update);
router.delete('/:id', authenticate, requireRole('admin'), remove);