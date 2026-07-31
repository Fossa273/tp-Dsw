import { Router } from 'express';
import {
  sanitizeClienteInput,
  findAll,
  findOne,
  update,
  add,
  remove,
} from './cliente.controller.js';

export const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeClienteInput, add);
router.put('/:id', sanitizeClienteInput, update);
router.patch('/:id', sanitizeClienteInput, update);
router.delete('/:id', remove);
