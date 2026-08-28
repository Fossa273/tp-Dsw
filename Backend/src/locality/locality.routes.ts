import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './locality.controller.js';
import { sanitizeLocalityInput } from './locality.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeLocalityInput, add);
router.put('/:id', sanitizeLocalityInput, update);
router.patch('/:id', sanitizeLocalityInput, update);
router.delete('/:id', remove);