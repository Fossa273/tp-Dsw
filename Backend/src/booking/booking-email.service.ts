import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { prisma } from '../shared/db/connection.js';
import { ApiError, isPositiveInteger } from '../shared/api-error.js';

// Resolve from the backend source/dist directory instead of process.cwd(), so
// attachments work whether the server is started from Backend or the repo root.
const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ATTACHMENTS_DIR = path.join(BACKEND_DIR, 'uploads', 'booking-email');
const DEFAULT_SUBJECT = 'Confirmacion de reserva #{{bookingId}}';
const DEFAULT_BODY = [
  'Hola {{clientName}},',
  '',
  'Tu reserva #{{bookingId}} fue confirmada.',
  'Trayecto: {{origin}} -> {{destination}}',
  'Salida: {{departure}}',
  'Asientos: {{seats}}',
  'Total: ${{price}}',
  '',
  'Gracias por viajar con RutaBus.',
].join('\n');
const CANCELLATION_SUBJECT = 'Cancelacion de reserva #{{bookingId}}';
const CANCELLATION_BODY = [
  'Hola {{clientName}},',
  '',
  'Tu reserva #{{bookingId}} fue {{action}}.',
  'Trayecto: {{origin}} -> {{destination}}',
  'Salida: {{departure}}',
  'Asientos: {{seats}}',
  'Total: ${{price}}',
  '',
  'Si tenes alguna consulta, contactanos.',
].join('\n');

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Faltan SMTP_USER y SMTP_PASS para enviar correos');
  }
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function getBookingEmailTemplate(templateId = 1) {
  const isCancellationTemplate = templateId === 2;
  let template = await prisma.bookingEmailTemplate.findUnique({
    where: { id: templateId },
    include: { attachments: true },
  });
  if (!template) {
    template = await prisma.bookingEmailTemplate.create({
      data: {
        id: templateId,
        subject: isCancellationTemplate ? CANCELLATION_SUBJECT : DEFAULT_SUBJECT,
        body: isCancellationTemplate ? CANCELLATION_BODY : DEFAULT_BODY,
      },
      include: { attachments: true },
    });
  }
  return template;
}

export async function updateBookingEmailTemplate(
  subject: string,
  body: string,
  files: Express.Multer.File[],
  templateId = 1,
) {
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  const current = await getBookingEmailTemplate(templateId);
  const attachmentData = [];
  for (const file of files) {
    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = path.join(ATTACHMENTS_DIR, filename);
    await fs.writeFile(storagePath, file.buffer);
    attachmentData.push({
      filename: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
    });
  }
  const updated = await prisma.bookingEmailTemplate.update({
    where: { id: current.id },
    data: {
      subject: subject.trim(),
      body: body.trim(),
      ...(attachmentData.length
        ? { attachments: { create: attachmentData } }
        : {}),
    },
    include: { attachments: true },
  });
  return updated;
}

export async function removeBookingEmailAttachment(id: number, templateId = 1) {
  const attachment = await prisma.bookingEmailAttachment.findUnique({ where: { id } });
  if (!attachment || attachment.templateId !== templateId) return false;
  await prisma.bookingEmailAttachment.delete({ where: { id } });
  await fs.unlink(attachment.storagePath).catch(() => undefined);
  return true;
}

function render(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
}

function formatEmailDate(value: Date | string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${day}/${month}/${date.getFullYear()} ${time}`;
}

export function getBookingEmailRecipients(booking: any) {
  return [
    booking.client?.email,
    ...(booking.passengers ?? []).map((passenger: any) => passenger.email),
    booking.passengerEmail,
  ]
    .map((email) => String(email ?? '').trim())
    .filter((email, index, emails) =>
      email &&
      emails.findIndex((candidate) => candidate.toLowerCase() === email.toLowerCase()) === index
    );
}

export async function sendBookingConfirmationEmail(booking: any, recipients: string[]) {
  const template = await getBookingEmailTemplate();
  const values = {
    clientName: booking.client
      ? `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim()
      : `${booking.passengerFirstName || ''} ${booking.passengerLastName || ''}`.trim() || 'cliente',
    bookingId: String(booking.id),
    origin: booking.trip?.journey?.origin?.name || '-',
    destination: booking.trip?.journey?.destination?.name || '-',
    departure: booking.trip?.departureDate
      ? formatEmailDate(booking.trip.departureDate)
      : booking.trip?.departureTime || '-',
    seats: String(booking.numSeats),
    price: Number(booking.price || 0).toLocaleString('es-AR'),
  };
  const transporter = createTransporter();
  const attachments = await Promise.all(
    template.attachments.map(async (attachment) => {
      await fs.access(attachment.storagePath);
      return {
        filename: attachment.filename,
        path: attachment.storagePath,
        contentType: attachment.mimeType,
      };
    }),
  );
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: recipients,
    subject: render(template.subject, values),
    text: render(template.body, values),
    attachments,
  });
}

export async function sendBookingCancellationEmail(
  booking: any,
  recipients: string[],
  action: 'cancelada' | 'eliminada',
) {
  const template = await getBookingEmailTemplate(2);
  const values = {
    clientName: booking.client
      ? `${booking.client.firstName || ''} ${booking.client.lastName || ''}`.trim()
      : `${booking.passengerFirstName || ''} ${booking.passengerLastName || ''}`.trim() || 'cliente',
    bookingId: String(booking.id),
    origin: booking.trip?.journey?.origin?.name || '-',
    destination: booking.trip?.journey?.destination?.name || '-',
    departure: booking.trip?.departureDate
      ? formatEmailDate(booking.trip.departureDate)
      : booking.trip?.departureTime || '-',
    seats: String(booking.numSeats),
    price: Number(booking.price || 0).toLocaleString('es-AR'),
    action,
  };
  const transporter = createTransporter();
  const attachments = await Promise.all(
    template.attachments.map(async (attachment) => {
      await fs.access(attachment.storagePath);
      return {
        filename: attachment.filename,
        path: attachment.storagePath,
        contentType: attachment.mimeType,
      };
    }),
  );
  await Promise.all(
    recipients.map((recipient) =>
      transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: recipient,
        subject: render(template.subject, values),
        text: render(template.body, values),
        attachments,
      }),
    ),
  );
}

export async function sendBookingCancellationNotice(
  booking: any,
  action: 'cancelada' | 'eliminada',
) {
  const recipients = getBookingEmailRecipients(booking);
  if (recipients.length === 0) {
    return `La reserva fue ${action}, pero no tiene emails de destino`;
  }
  try {
    await sendBookingCancellationEmail(booking, recipients, action);
    return null;
  } catch (error) {
    console.error(`[EMAIL] No se pudo enviar el aviso de reserva ${action}:`, error);
    const responseCode =
      typeof error === 'object' && error !== null && 'responseCode' in error
        ? Number(error.responseCode)
        : null;
    return responseCode === 535
      ? `La reserva fue ${action}, pero Gmail rechazo las credenciales SMTP. Configure una contrasena de aplicacion.`
      : `La reserva fue ${action}, pero no se pudo enviar el email`;
  }
}

export { DEFAULT_BODY, DEFAULT_SUBJECT };

export async function updateBookingEmailTemplateInput(
  subjectValue: unknown,
  bodyValue: unknown,
  files: Express.Multer.File[],
  templateId = 1
) {
  const subject = typeof subjectValue === 'string'
    ? subjectValue.trim()
    : '';
  const body = typeof bodyValue === 'string'
    ? bodyValue.trim()
    : '';
  if (!subject || !body) {
    throw new ApiError(400, 'El asunto y el mensaje son obligatorios');
  }
  return updateBookingEmailTemplate(subject, body, files, templateId);
}

export async function removeBookingEmailAttachmentInput(
  rawId: unknown,
  templateId = 1
) {
  const id = Number(rawId);
  if (!isPositiveInteger(id)) {
    throw new ApiError(400, 'El identificador del adjunto no es valido');
  }
  const removed = await removeBookingEmailAttachment(id, templateId);
  if (!removed) {
    throw new ApiError(404, 'Adjunto no encontrado');
  }
  return { message: 'Adjunto eliminado' };
}
