import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './vehicle.controller.js';
import { sanitizeVehicleInput } from './vehicle.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeVehicleInput, add);
router.put('/:id', sanitizeVehicleInput, update);
router.patch('/:id', sanitizeVehicleInput, update);
router.delete('/:id', remove);