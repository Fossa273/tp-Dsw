import { Router } from 'express';
import { findAll, updatePrice } from './vehicle-category.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();
router.get('/', findAll);
router.patch('/:id/price', authenticate, requireRole('admin'), updatePrice);