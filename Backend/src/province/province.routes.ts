import { Router } from 'express';
import {
  findAll,
  findOne,
  update,
  add,
  remove,
} from './province.controller.js';
import { sanitizeProvinceInput } from './province.validation.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeProvinceInput, add);
router.put('/:id', sanitizeProvinceInput, update);
router.patch('/:id', sanitizeProvinceInput, update);
router.delete('/:id', remove);