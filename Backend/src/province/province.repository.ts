import { Repository } from '../shared/repository.js';
import { Province } from './province.entity.js';
import { pool } from '../shared/db/connection.js';

export class ProvinceRepository implements Repository<Province> {
  public async findAll(): Promise<Province[] | undefined> {
    const [provinces] = await pool.query('SELECT * FROM provinces');
    return provinces as Province[];
  }

  public async findOne(item: { id: string }): Promise<Province | undefined> {
    const [rows] = await pool.query('SELECT * FROM provinces WHERE id = ?', [
      item.id,
    ]);
    const provinces = rows as Province[];
    return provinces.length > 0 ? provinces[0] : undefined;
  }

  // Find a province by name (to validate duplicates)
  public async findByName(name: string): Promise<Province | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM provinces WHERE name = ?',
      [name]
    );
    const provinces = rows as Province[];
    return provinces.length > 0 ? provinces[0] : undefined;
  }

  public async add(item: Province): Promise<Province | undefined> {
    const [result] = await pool.query(
      'INSERT INTO provinces (name) VALUES (?)',
      [item.name ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Province): Promise<Province | undefined> {
    const [result] = await pool.query(
      'UPDATE provinces SET name = ? WHERE id = ?',
      [item.name ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Province | undefined> {
    const [result] = await pool.query('DELETE FROM provinces WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reset the counter so the next id stays sequential
    try {
      await pool.query('ALTER TABLE provinces AUTO_INCREMENT = 1');
    } catch {
      // Ignored if the connection lacks ALTER permissions
    }
    return { id: item.id } as Province;
  }
}