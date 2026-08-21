import { Repository } from '../shared/repository.js';
import { Cliente } from './cliente.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

// Columnas publicas: nunca exponemos el hash de la password
const PUBLIC_COLUMNS =
  'id, nombre, apellido, dni, email, telefono, activo, logged';

export class clienteRepository implements Repository<Cliente> {
  public async findAll(): Promise<Cliente[] | undefined> {
    const [clientes] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM clientes WHERE activo = 1`
    );
    return clientes as Cliente[];
  }

  // Clientes con baja logica: (para listado exclusivo del administrador)
  public async findAllInactivos(): Promise<Cliente[] | undefined> {
    const [clientes] = await pool.query(
      'SELECT id, nombre, apellido, dni, email, telefono FROM clientes WHERE activo = 0'
    );
    return clientes as Cliente[];
  }

  public async findOne(item: { id: string }): Promise<Cliente | undefined> {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM clientes WHERE id = ? AND activo = 1`,
      [item.id]
    );
    const clientes = rows as Cliente[];
    return clientes.length > 0 ? clientes[0] : undefined;
  }

  // Solo para login: devuelve tambien el hash de la password
  public async findByEmailWithPassword(
    email: string
  ): Promise<Cliente | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM clientes WHERE email = ? AND activo = 1',
      [email]
    );
    const clientes = rows as Cliente[];
    return clientes.length > 0 ? clientes[0] : undefined;
  }

  public async add(item: Cliente): Promise<Cliente | undefined> {
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, apellido, dni, email, telefono, activo, password, logged) VALUES (?, ?, ?, ?, ?, 1, ?, 0)',
      [
        item.nombre ?? null,
        item.apellido ?? null,
        item.dni ?? null,
        item.email ?? null,
        item.telefono ?? null,
        item.password ?? null,
      ]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Cliente): Promise<Cliente | undefined> {
    // Solo se actualizan los campos que vienen en el pedido
    const campos: string[] = [];
    const params: (string | null)[] = [];

    if (item.nombre !== undefined) {
      campos.push('nombre = ?');
      params.push(item.nombre);
    }
    if (item.apellido !== undefined) {
      campos.push('apellido = ?');
      params.push(item.apellido);
    }
    if (item.dni !== undefined) {
      campos.push('dni = ?');
      params.push(item.dni);
    }
    if (item.email !== undefined) {
      campos.push('email = ?');
      params.push(item.email);
    }
    if (item.telefono !== undefined) {
      campos.push('telefono = ?');
      params.push(item.telefono);
    }
    if (item.password) {
      campos.push('password = ?');
      params.push(item.password);
    }

    if (campos.length === 0) {
      return undefined;
    }
    params.push(String(item.id));

    const [result] = await pool.query(
      `UPDATE clientes SET ${campos.join(', ')} WHERE id = ? AND activo = 1`,
      params
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Cliente | undefined> {
    const [result] = await pool.query(
      'UPDATE clientes SET activo = 0, logged = 0 WHERE id = ?',
      [item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return { id: item.id } as Cliente;
  }

  public async setLogged(id: string, logged: boolean): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE clientes SET logged = ? WHERE id = ? AND activo = 1',
      [logged ? 1 : 0, id]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }

  // Reactivar un cliente con baja logica
  public async reactivar(id: string): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE clientes SET activo = 1 WHERE id = ? AND activo = 0',
      [id]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }

  public async updatePasswordByEmail(
    email: string,
    passwordHash: string
  ): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE clientes SET password = ? WHERE email = ? AND activo = 1',
      [passwordHash, email]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }
}
