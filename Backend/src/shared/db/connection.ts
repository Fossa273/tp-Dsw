import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const url = new URL(databaseUrl);
  if (!url.hostname || !url.username || !url.password) {
    throw new Error('DATABASE_URL no tiene el formato mysql válido.');
  }

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 4000),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    ssl: { rejectUnauthorized: false },
    connectionLimit: 5,
    connectTimeout: 15000,
  });

  prismaInstance = new PrismaClient({ adapter });
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
