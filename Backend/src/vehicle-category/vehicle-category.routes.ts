import { Router } from 'express';
import { findAll, updateFuelConsumption, updatePrice, updateSettings } from './vehicle-category.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const router = Router();
router.get('/', findAll);
router.patch('/:id', authenticate, requireRole('admin'), updateSettings);
router.patch('/:id/price', authenticate, requireRole('admin'), updatePrice);
router.patch('/:id/fuel-consumption', authenticate, requireRole('admin'), updateFuelConsumption);