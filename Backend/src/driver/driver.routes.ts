import { Router } from 'express';
import {
  findAll,
  findAllInactive,
  findOne,
  update,
  add,
  remove,
  reactivate,
} from './driver.controller.js';
import { sanitizeDriverInput } from './driver.validation.js';

export const router = Router();

router.post('/:id/reactivate', reactivate);
router.get('/inactive', findAllInactive);
router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeDriverInput, add);
router.put('/:id', sanitizeDriverInput, update);
router.patch('/:id', sanitizeDriverInput, update);
router.delete('/:id', remove);
