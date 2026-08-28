import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  login,
  logout,
  resetPassword,
  reactivate,
} from './client.controller.js';
import { sanitizeClientInput } from './client.validation.js';

export const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.post('/:id/reactivate', reactivate);
router.get('/inactive', findAllInactive);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeClientInput, add);
router.put('/:id', sanitizeClientInput, update);
router.patch('/:id', sanitizeClientInput, update);
router.delete('/:id', remove);