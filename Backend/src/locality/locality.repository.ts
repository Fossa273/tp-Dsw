import { Repository } from '../shared/repository.js';
import { Locality } from './locality.entity.js';
import { pool } from '../shared/db/connection.js';

export class LocalityRepository implements Repository<Locality> {
  public async findAll(): Promise<Locality[] | undefined> {
    const [localities] = await pool.query('SELECT * FROM localities');
    return localities as Locality[];
  }

  public async findOne(item: { id: string }): Promise<Locality | undefined> {
    const [rows] = await pool.query('SELECT * FROM localities WHERE id = ?', [
      item.id,
    ]);
    const localities = rows as Locality[];
    return localities.length > 0 ? localities[0] : undefined;
  }

  // Find a locality by name (to validate duplicates)
  public async findByName(name: string): Promise<Locality | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM localities WHERE name = ?',
      [name]
    );
    const localities = rows as Locality[];
    return localities.length > 0 ? localities[0] : undefined;
  }

  public async add(item: Locality): Promise<Locality | undefined> {
    const [result] = await pool.query(
      'INSERT INTO localities (name) VALUES (?)',
      [item.name ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Locality): Promise<Locality | undefined> {
    const [result] = await pool.query(
      'UPDATE localities SET name = ? WHERE id = ?',
      [item.name ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Locality | undefined> {
    const [result] = await pool.query('DELETE FROM localities WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reset the counter so the next id stays sequential
    try {
      await pool.query('ALTER TABLE localities AUTO_INCREMENT = 1');
    } catch {
      // Ignored if the connection lacks ALTER permissions
    }
    return { id: item.id } as Locality;
  }
}