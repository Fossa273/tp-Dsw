import { Repository } from '../shared/repository.js';
import { Driver } from './driver.entity.js';
import { pool } from '../shared/db/connection.js';

const PUBLIC_COLUMNS = 'id, dni, firstName, lastName, phone, active';

export class DriverRepository implements Repository<Driver> {
  public async findAll(): Promise<Driver[] | undefined> {
    const [drivers] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM drivers WHERE active = 1`
    );
    return drivers as Driver[];
  }

  // Drivers with logical deletion (for the admin-only listing)
  public async findAllInactive(): Promise<Driver[] | undefined> {
    const [drivers] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM drivers WHERE active = 0`
    );
    return drivers as Driver[];
  }

  public async findOne(item: { id: string }): Promise<Driver | undefined> {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM drivers WHERE id = ? AND active = 1`,
      [item.id]
    );
    const drivers = rows as Driver[];
    return drivers.length > 0 ? drivers[0] : undefined;
  }

  public async findByDni(dni: string): Promise<Driver | undefined> {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM drivers WHERE dni = ?`,
      [dni]
    );
    const drivers = rows as Driver[];
    return drivers.length > 0 ? drivers[0] : undefined;
  }

  public async add(item: Driver): Promise<Driver | undefined> {
    const [result] = await pool.query(
      'INSERT INTO drivers (dni, firstName, lastName, phone, active) VALUES (?, ?, ?, ?, 1)',
      [
        item.dni ?? null,
        item.firstName ?? null,
        item.lastName ?? null,
        item.phone ?? null,
      ]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId), active: 1 };
  }

  public async update(item: Driver): Promise<Driver | undefined> {
    // Only fields present in the request are updated
    const fields: string[] = [];
    const params: (string | null)[] = [];

    if (item.dni !== undefined) {
      fields.push('dni = ?');
      params.push(item.dni);
    }
    if (item.firstName !== undefined) {
      fields.push('firstName = ?');
      params.push(item.firstName);
    }
    if (item.lastName !== undefined) {
      fields.push('lastName = ?');
      params.push(item.lastName);
    }
    if (item.phone !== undefined) {
      fields.push('phone = ?');
      params.push(item.phone);
    }

    if (fields.length === 0) {
      return undefined;
    }
    params.push(String(item.id));

    const [result] = await pool.query(
      `UPDATE drivers SET ${fields.join(', ')} WHERE id = ? AND active = 1`,
      params
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Driver | undefined> {
    const [result] = await pool.query(
      'UPDATE drivers SET active = 0 WHERE id = ?',
      [item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return { id: item.id } as Driver;
  }

  // Reactivate a logically deleted driver
  public async reactivate(id: string): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE drivers SET active = 1 WHERE id = ? AND active = 0',
      [id]
    );
    const header = result as { affectedRows: number };
    return header.affectedRows > 0;
  }
}
