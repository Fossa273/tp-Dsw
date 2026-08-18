import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './provincia.controller.js';
import { sanitizeProvinciaInput } from './provincia.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeProvinciaInput, add);
router.put('/:id', sanitizeProvinciaInput, update);
router.patch('/:id', sanitizeProvinciaInput, update);
router.delete('/:id', remove);
