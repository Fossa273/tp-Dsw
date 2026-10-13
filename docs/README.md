# RutaBus: instalación y ejecución

Estas instrucciones permiten instalar y ejecutar RutaBus localmente en Windows,
macOS o Linux. El proyecto está compuesto por un backend Node/Express con
MySQL y un frontend React/Vite.

## Requisitos previos

- Node.js 20 o superior.
- pnpm 11 o superior.
- MySQL 8/MariaDB compatible, iniciado y accesible desde el equipo.
- Git.

Verificar las herramientas:

```bash
node --version
pnpm --version
mysql --version
```

Si pnpm no está instalado:

```bash
corepack enable
corepack prepare pnpm@11.1.2 --activate
```

## 1. Obtener el proyecto

```bash
git clone https://github.com/Fossa273/tp-Dsw.git
cd tp-Dsw
```

## 2. Configurar MySQL

Prisma es el responsable de crear y sincronizar las tablas a partir de
`prisma/schema.prisma`. En una instalación nueva hay que crear previamente la
base de datos y un usuario con permisos sobre ella, porque
`pnpm run db:generate` solo genera el cliente de Prisma y no crea bases,
usuarios ni tablas.

Desde una consola de MySQL con permisos administrativos:

```sql
CREATE DATABASE rutabus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'dsw'@'localhost' IDENTIFIED BY 'dsw';
GRANT ALL PRIVILEGES ON rutabus.* TO 'dsw'@'localhost';
FLUSH PRIVILEGES;
```

Si la base o el usuario ya existen, no es necesario ejecutar nuevamente estas
sentencias. También se puede usar otro usuario, siempre que `DATABASE_URL`
coincida con sus credenciales y tenga permisos sobre la base. En ese caso, este
paso puede omitirse.

## 3. Configurar el backend

Desde la carpeta `Backend`, copiar el archivo de ejemplo:

```bash
copy .env.example .env
```

En macOS/Linux:

```bash
cp .env.example .env
```

Editar `.env` y establecer como mínimo:

```env
DATABASE_URL="mysql://dsw:dsw@localhost:3306/rutabus"
PORT="3000"
CORS_ORIGIN="http://localhost:5173"
FUEL_PRICE_PER_KM="100"
OSM_USER_AGENT="tp-dsw-rutabus/1.0 contacto@example.com"
OSM_EMAIL="tu-email-real@example.com"
OSM_REFERER="http://localhost:5173/"
JWT_SECRET="reemplazar-por-una-clave-larga-y-segura"
JWT_EXPIRES_IN="8h"
```

`OSM_EMAIL` debe reemplazarse por un email real si se utiliza el cálculo de
distancias mediante OpenStreetMap. Las variables SMTP son opcionales; solo son
necesarias para enviar emails de confirmación:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="tu-cuenta@gmail.com"
SMTP_PASS="contraseña-de-aplicacion"
MAIL_FROM="tu-cuenta@gmail.com"
```

Instalar dependencias y generar el cliente Prisma:

```bash
pnpm install
pnpm run db:generate
pnpm run db:push
```

`JWT_SECRET` es obligatorio para iniciar el backend. Debe ser una clave larga,
privada y distinta entre desarrollo y producción. `JWT_EXPIRES_IN` controla la
vigencia de los tokens, por ejemplo `8h`.

Para cargar los datos de demostración, ejecutar:

```bash
pnpm run db:seed
```

La seed genera clientes, localidades, trayectos, viajes y reservas suficientes
para probar los listados paginados. También crea las credenciales de prueba
indicadas en [SEED_CREDENTIALS.md](../SEED_CREDENTIALS.md).

El orden recomendado completo es:

```text
crear base/usuario MySQL → configurar .env → pnpm install
→ pnpm run db:generate → pnpm run db:push → pnpm run db:seed
```

Si ya existe una base `rutabus` y un usuario válido, el flujo comienza en
`configurar .env`.

> `pnpm run db:reset` borra y recrea las tablas mediante Prisma y vuelve a
> ejecutar la seed. Usar únicamente en desarrollo porque elimina los datos.

## 4. Ejecutar el backend

Desde `Backend`:

```bash
pnpm run dev
```

El backend queda disponible en:

```text
http://localhost:3000
```

Comprobarlo con:

```bash
curl http://localhost:3000/api/health
```

La respuesta esperada contiene `"status":"ok"`.

## 5. Configurar y ejecutar el frontend

Abrir otra terminal y ubicarse en `Frontend/app`:

```bash
cd Frontend/app
pnpm install
```

Opcionalmente, crear un archivo `.env` si el backend no utiliza la URL
predeterminada:

```env
VITE_API_URL="http://localhost:3000/api"
```

Iniciar Vite:

```bash
pnpm run dev
```

Abrir la URL mostrada por Vite, normalmente:

```text
http://localhost:5173
```

## Credenciales de prueba

| Usuario       | Email               | Contraseña   |
| ------------- | ------------------- | ------------ |
| Administrador | `admin@rutabus.com` | `admin123`   |
| Cliente       | `juan@example.com`  | `cliente123` |

El administrador puede acceder a los módulos de gestión. El cliente puede
consultar y gestionar sus reservas.

## Comandos útiles

### Backend

```bash
pnpm run dev              # Compilación/watch y servidor
pnpm run db:generate     # Generar cliente Prisma
pnpm run db:push         # Sincronizar schema con la base
pnpm run db:seed         # Cargar datos demo
pnpm run db:reset        # Reiniciar base y seed; destruye datos
pnpm run typecheck:seed  # Verificar tipos de la seed
```

### Frontend

```bash
pnpm run dev             # Servidor de desarrollo
pnpm run build           # Build de producción
pnpm run preview         # Servir el build generado
pnpm run lint            # Ejecutar ESLint
```

## Solución de problemas

### No se puede conectar a MySQL

1. Confirmar que MySQL/MariaDB esté iniciado.
2. Verificar usuario, contraseña, host y puerto en `Backend/.env`.
3. Confirmar que exista la base `rutabus`.
4. Repetir `pnpm run db:generate` y `pnpm run db:seed`.

### El frontend no conecta con el backend

1. Confirmar que el backend esté ejecutándose en el puerto 3000.
2. Verificar `VITE_API_URL`.
3. Revisar que `CORS_ORIGIN` coincida con la URL del frontend.

### Faltan datos de prueba

Desde `Backend`, ejecutar:

```bash
pnpm run db:seed
```

Para empezar desde una base limpia:

```bash
pnpm run db:reset
```

## Documentación relacionada

- [Propuesta del proyecto](./proposal/proposal.md).
- [Reuniones registradas](./02%20-%20reuniones/minutas.md)
- [Tracking](./03%20-%20tracking/tracking.md)
- [Documentación de la API](./doc-api/api.md).
