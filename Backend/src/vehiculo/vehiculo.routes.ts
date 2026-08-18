import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './vehiculo.controller.js';
import { sanitizeVehiculoInput } from './vehiculo.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeVehiculoInput, add);
router.put('/:id', sanitizeVehiculoInput, update);
router.patch('/:id', sanitizeVehiculoInput, update);
router.delete('/:id', remove);
