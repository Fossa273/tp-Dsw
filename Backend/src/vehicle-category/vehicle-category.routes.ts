import { Router } from 'express';
import { findAll, updatePrice } from './vehicle-category.controller.js';

export const router = Router();
router.get('/', findAll);
router.patch('/:id/price', updatePrice);