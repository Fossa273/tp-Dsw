import { Request, Response } from 'express';
import multer from 'multer';
import {
  getBookingEmailTemplate,
  removeBookingEmailAttachment,
  updateBookingEmailTemplate,
} from './booking-email.service.js';

export const bookingEmailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
});

export async function getTemplate(_req: Request, res: Response) {
  res.json(await getBookingEmailTemplate());
}

export async function updateTemplate(req: Request, res: Response) {
  const subject = String(req.body.subject || '').trim();
  const body = String(req.body.body || '').trim();
  if (!subject || !body) {
    res.status(400).json({ error: 'El asunto y el mensaje son obligatorios' });
    return;
  }
  const files = (req.files || []) as Express.Multer.File[];
  res.json(await updateBookingEmailTemplate(subject, body, files));
}

export async function deleteAttachment(req: Request, res: Response) {
  const removed = await removeBookingEmailAttachment(Number(req.params.id));
  if (!removed) {
    res.status(404).json({ error: 'Adjunto no encontrado' });
    return;
  }
  res.json({ message: 'Adjunto eliminado' });
}
