import { Router } from 'express';
import { findAll, findOne, update, add, remove } from './trip.controller.js';
import { sanitizeTripInput } from './trip.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeTripInput, add);
router.put('/:id', sanitizeTripInput, update);
router.patch('/:id', sanitizeTripInput, update);
router.delete('/:id', remove);