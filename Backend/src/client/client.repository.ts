import { Repository } from '../shared/repository.js';
import { Client } from './client.entity.js';
import { pool } from '../shared/db/connection.js';

// Public columns: never expose the password hash
const PUBLIC_COLUMNS =
  'id, firstName, lastName, dni, email, phone, active, logged';

export class ClientRepository implements Repository<Client> {
  public async findAll(): Promise<Client[] | undefined> {
    const [clients] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM clients WHERE active = 1`
    );
    return clients as Client[];
  }

  // Clients with logical deletion (for the admin-only listing)
  public async findAllInactive(): Promise<Client[] | undefined> {
    const [clients] = await pool.query(
      'SELECT id, firstName, lastName, dni, email, phone FROM clients WHERE active = 0'
    );
    return clients as Client[];
  }

  public async findOne(item: { id: string }): Promise<Client | undefined> {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM clients WHERE id = ? AND active = 1`,
      [item.id]
    );
    const clients = rows as Client[];
    return clients.length > 0 ? clients[0] : undefined;
  }

  // Only for login: also returns the password hash
  public async findByEmailWithPassword(
    email: string
  ): Promise<Client | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE email = ? AND active = 1',
      [email]
    );
    const clients = rows as Client[];
    return clients.length > 0 ? clients[0] : undefined;
  }

  public async add(item: Client): Promise<Client | undefined> {
    const [result] = await pool.query(
      'INSERT INTO clients (firstName, lastName, dni, email, phone, active, password, logged) VALUES (?, ?, ?, ?, ?, 1, ?, 0)',
      [
        item.firstName ?? null,
        item.lastName ?? null,
        item.dni ?? null,
        item.email ?? null,
        item.phone ?? null,
        item.password ?? null,
      ]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Client): Promise<Client | undefined> {
    // Only fields present in the request are updated
    const fields: string[] = [];
    const params: (string | null)[] = [];

    if (item.firstName !== undefined) {
      fields.push('firstName = ?');
      params.push(item.firstName);
    }
    if (item.lastName !== undefined) {
      fields.push('lastName = ?');
      params.push(item.lastName);
    }
    if (item.dni !== undefined) {
      fields.push('dni = ?');
      params.push(item.dni);
    }
    if (item.email !== undefined) {
      fields.push('email = ?');
      params.push(item.email);
    }
    if (item.phone !== undefined) {
      fields.push('phone = ?');
      params.push(item.phone);
    }
    if (item.password) {
      fields.push('password = ?');
      params.push(item.password);
    }

    if (fields.length === 0) {
      return undefined;
    }
    params.push(String(item.id));

    const [result] = await pool.query(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ? AND active = 1`,
      params
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Client | undefined> {
    const [result] = await pool.query(
      'UPDATE clients SET active = 0, logged = 0 WHERE id = ?',
      [item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return { id: item.id } as Client;
  }

  public async setLogged(id: string, logged: boolean): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE clients SET logged = ? WHERE id = ? AND active = 1',
      [logged ? 1 : 0, id]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }

  // Reactivate a logically deleted client
  public async reactivate(id: string): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE clients SET active = 1 WHERE id = ? AND active = 0',
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
      'UPDATE clients SET password = ? WHERE email = ? AND active = 1',
      [passwordHash, email]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }
}