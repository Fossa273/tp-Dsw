import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { prisma } from '../shared/db/connection.js';

const ATTACHMENTS_DIR = path.resolve(process.cwd(), 'uploads', 'booking-email');
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

export async function getBookingEmailTemplate() {
  let template = await prisma.bookingEmailTemplate.findUnique({
    where: { id: 1 },
    include: { attachments: true },
  });
  if (!template) {
    template = await prisma.bookingEmailTemplate.create({
      data: { id: 1, subject: DEFAULT_SUBJECT, body: DEFAULT_BODY },
      include: { attachments: true },
    });
  }
  return template;
}

export async function updateBookingEmailTemplate(
  subject: string,
  body: string,
  files: Express.Multer.File[],
) {
  await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  const current = await getBookingEmailTemplate();
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

export async function removeBookingEmailAttachment(id: number) {
  const attachment = await prisma.bookingEmailAttachment.findUnique({ where: { id } });
  if (!attachment) return false;
  await prisma.bookingEmailAttachment.delete({ where: { id } });
  await fs.unlink(attachment.storagePath).catch(() => undefined);
  return true;
}

function render(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
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
      ? new Date(booking.trip.departureDate).toLocaleString('es-AR')
      : booking.trip?.departureTime || '-',
    seats: String(booking.numSeats),
    price: Number(booking.price || 0).toLocaleString('es-AR'),
  };
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: recipients,
    subject: render(template.subject, values),
    text: render(template.body, values),
    attachments: await Promise.all(
      template.attachments.map(async (attachment) => ({
        filename: attachment.filename,
        path: attachment.storagePath,
        contentType: attachment.mimeType,
      })),
    ),
  });
}

export { DEFAULT_BODY, DEFAULT_SUBJECT };
