import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ADMIN_PASSWORD_HASH =
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123
const DEMO_PASSWORD_HASH =
  '09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9'; // cliente123

async function main() {
  // ------------------------------------------------------------
  // Provinces / Localities / Vehicles / Drivers / Clients
  // ------------------------------------------------------------
  await prisma.province.createMany({
    data: [
      { id: 1, name: 'Buenos Aires' },
      { id: 2, name: 'Córdoba' },
      { id: 3, name: 'Santa Fe' },
      { id: 4, name: 'Mendoza' },
      { id: 5, name: 'Tucumán' },
    ],
    skipDuplicates: true,
  });

  await prisma.locality.createMany({
    data: [
      { id: 1, name: 'CABA' },
      { id: 2, name: 'La Plata' },
      { id: 3, name: 'Mar del Plata' },
      { id: 4, name: 'Rosario' },
      { id: 5, name: 'San Miguel de Tucumán' },
      { id: 6, name: 'Bariloche' },
    ],
    skipDuplicates: true,
  });

  await prisma.journey.createMany({
    data: [
      { id: 1, originId: 1, destinationId: 2, distanceKm: 60, durationMinutes: 70 },
      { id: 2, originId: 1, destinationId: 4, distanceKm: 300, durationMinutes: 240 },
      { id: 3, originId: 2, destinationId: 3, distanceKm: 380, durationMinutes: 300 },
      { id: 4, originId: 4, destinationId: 5, distanceKm: 810, durationMinutes: 600 },
      { id: 5, originId: 1, destinationId: 6, distanceKm: 1600, durationMinutes: 840 },
    ],
    skipDuplicates: true,
  });

  await prisma.vehicle.createMany({
    data: [
      { id: 1, maxCapacity: 45 },
      { id: 2, maxCapacity: 30 },
      { id: 3, maxCapacity: 60 },
      { id: 4, maxCapacity: 20 },
      { id: 5, maxCapacity: 50 },
    ],
    skipDuplicates: true,
  });

  await prisma.driver.createMany({
    data: [
      { id: 1, dni: '30123456', firstName: 'Carlos', lastName: 'Gutierrez', phone: '1112223334', active: 1 },
      { id: 2, dni: '30234567', firstName: 'Marta', lastName: 'Sosa', phone: '2223334445', active: 1 },
      { id: 3, dni: '30345678', firstName: 'Jorge', lastName: 'Fernandez', phone: '3334445556', active: 1 },
      { id: 4, dni: '30456789', firstName: 'Silvia', lastName: 'Ramos', phone: '4445556667', active: 1 },
      { id: 5, dni: '30567890', firstName: 'Diego', lastName: 'Alvarez', phone: '5556667778', active: 1 },
    ],
    skipDuplicates: true,
  });

  await prisma.client.createMany({
    data: [
      {
        id: 1,
        firstName: 'Juan',
        lastName: 'Perez',
        dni: '30123456',
        email: 'juan@example.com',
        phone: '1234567890',
        active: 1,
        password: DEMO_PASSWORD_HASH,
        logged: 0,
      },
      {
        id: 2,
        firstName: 'Juana',
        lastName: 'Gonzalez',
        dni: '30234567',
        email: 'maria@example.com',
        phone: '0987654321',
        active: 1,
        logged: 0,
      },
      {
        id: 3,
        firstName: 'Pedro',
        lastName: 'Rodriguez',
        dni: '30345678',
        email: 'pedro@example.com',
        phone: '1122334455',
        active: 1,
        logged: 0,
      },
      {
        id: 4,
        firstName: 'Ana',
        lastName: 'Lopez',
        dni: '30456789',
        email: 'ana@example.com',
        phone: '5566778899',
        active: 1,
        logged: 0,
      },
      {
        id: 5,
        firstName: 'Luis',
        lastName: 'Martinez',
        dni: '30567890',
        email: 'luis@example.com',
        phone: '9988776655',
        active: 1,
        logged: 0,
      },
    ],
    skipDuplicates: true,
  });

  // Ensure the demo user has the known password
  await prisma.client.updateMany({
    where: {
      id: 1,
      OR: [{ password: null }, { password: '' }],
    },
    data: { password: DEMO_PASSWORD_HASH },
  });

  // ------------------------------------------------------------
  // Trips (viajes): journey + driver + vehicle + departure/arrival dates
  // ------------------------------------------------------------
  await prisma.trip.createMany({
    data: [
      {
        id: 1,
        journeyId: 1,
        driverId: 1,
        vehicleId: 1,
        departureDate: new Date('2026-09-15T08:00:00'),
        arrivalDate: new Date('2026-09-15T09:10:00'),
      },
      {
        id: 2,
        journeyId: 2,
        driverId: 2,
        vehicleId: 2,
        departureDate: new Date('2026-09-16T10:00:00'),
        arrivalDate: new Date('2026-09-16T14:00:00'),
      },
      {
        id: 3,
        journeyId: 3,
        driverId: 3,
        vehicleId: 3,
        departureDate: new Date('2026-09-17T18:00:00'),
        arrivalDate: new Date('2026-09-17T23:00:00'),
      },
      {
        id: 4,
        journeyId: 1,
        driverId: 4,
        vehicleId: 4,
        departureDate: new Date('2026-09-18T07:30:00'),
        arrivalDate: new Date('2026-09-18T08:40:00'),
      },
      {
        id: 5,
        journeyId: 5,
        driverId: 5,
        vehicleId: 5,
        departureDate: new Date('2026-09-19T20:00:00'),
        arrivalDate: new Date('2026-09-20T06:00:00'),
      },
    ],
    skipDuplicates: true,
  });

  // ------------------------------------------------------------
  // Bookings (reservas): client + trip + seats + state
  // ------------------------------------------------------------
  await prisma.booking.createMany({
    data: [
      { id: 1, clientId: 1, tripId: 1, numSeats: 2, state: 'confirmed' },
      { id: 2, clientId: 2, tripId: 2, numSeats: 1, state: 'pending' },
      { id: 3, clientId: 3, tripId: 1, numSeats: 4, state: 'confirmed' },
      { id: 4, clientId: 4, tripId: 3, numSeats: 2, state: 'cancelled' },
      { id: 5, clientId: 5, tripId: 5, numSeats: 1, state: 'pending' },
    ],
    skipDuplicates: true,
  });

  // ------------------------------------------------------------
  // Administrator: client with id = 0
  // MySQL only stores 0 in an AUTO_INCREMENT column when
  // NO_AUTO_VALUE_ON_ZERO is enabled, so use raw SQL for this row.
  // ------------------------------------------------------------
  const [adminRow] = await prisma.$queryRawUnsafe(
    `SELECT id FROM clients WHERE id = 0`
  ) as { id: number }[];

  if (!adminRow) {
    await prisma.$executeRawUnsafe(
      `SET SESSION sql_mode = CONCAT('NO_AUTO_VALUE_ON_ZERO,', @@SESSION.sql_mode)`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO clients (id, firstName, lastName, dni, email, phone, active, password, logged)
       VALUES (0, 'Admin', 'RutaBus', NULL, 'admin@rutabus.com', '0000000000', 1, '${ADMIN_PASSWORD_HASH}', 0)
       ON DUPLICATE KEY UPDATE id = id`
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
