# Credenciales de prueba (seed)

Estas cuentas se crean automaticamente al ejecutar `Backend/seed.sql`.

## Usuario administrador
| Campo | Valor |
| --- | --- |
| Email | `admin@rutabus.com` |
| Contraseña | `admin123` |
| Tipo | Administrador (cliente id 0) |

## Cliente de prueba (Juan Perez)
| Campo | Valor |
| --- | --- |
| Email | `juan@example.com` |
| Contraseña | `cliente123` |
| DNI | `30123456` |

> Nota: las contraseñas se almacenan como hash SHA-256 en la base de datos.
> Corresponden a los valores indicados arriba en texto plano.
