import { Router } from 'express';
import {
  findAll,
  findAllInactivos,
  findOne,
  update,
  add,
  remove,
  login,
  logout,
  resetPassword,
  reactivar,
} from './cliente.controller.js';
import { sanitizeClienteInput } from './cliente.validation.js';

export const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.post('/:id/reactivar', reactivar);

router.get('/', findAll);
router.get('/inactivos', findAllInactivos);
router.get('/:id', findOne);
router.post('/', sanitizeClienteInput, add);
router.put('/:id', sanitizeClienteInput, update);
router.patch('/:id', sanitizeClienteInput, update);
router.delete('/:id', remove);
