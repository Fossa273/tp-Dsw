import { Request, Response } from 'express';
import multer from 'multer';
import {
  getBookingEmailTemplate,
  removeBookingEmailAttachmentInput,
  updateBookingEmailTemplateInput,
} from './booking-email.service.js';

export const bookingEmailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 10 * 1024 * 1024 },
});

export async function getTemplate(_req: Request, res: Response) {
  res.json(await getBookingEmailTemplate());
}

export async function updateTemplate(req: Request, res: Response) {
  res.json(
    await updateBookingEmailTemplateInput(
      req.body.subject,
      req.body.body,
      (req.files || []) as Express.Multer.File[]
    )
  );
}

export async function deleteAttachment(req: Request, res: Response) {
  res.json(
    await removeBookingEmailAttachmentInput(req.params.id)
  );
}

export async function getCancellationTemplate(_req: Request, res: Response) {
  res.json(await getBookingEmailTemplate(2));
}

export async function updateCancellationTemplate(
  req: Request,
  res: Response
) {
  res.json(
    await updateBookingEmailTemplateInput(
      req.body.subject,
      req.body.body,
      (req.files || []) as Express.Multer.File[],
      2
    )
  );
}

export async function deleteCancellationAttachment(
  req: Request,
  res: Response
) {
  res.json(
    await removeBookingEmailAttachmentInput(req.params.id, 2)
  );
}
