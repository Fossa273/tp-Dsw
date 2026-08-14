import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './localidad.controller.js';
import { sanitizeLocalidadInput } from './localidad.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeLocalidadInput, add);
router.put('/:id', sanitizeLocalidadInput, update);
router.patch('/:id', sanitizeLocalidadInput, update);
router.delete('/:id', remove);
