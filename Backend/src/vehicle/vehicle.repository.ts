import { Repository } from '../shared/repository.js';
import { Vehicle } from './vehicle.entity.js';
import { pool } from '../shared/db/connection.js';

export class VehicleRepository implements Repository<Vehicle> {
  public async findAll(): Promise<Vehicle[] | undefined> {
    const [vehicles] = await pool.query('SELECT * FROM vehicles');
    return vehicles as Vehicle[];
  }

  public async findOne(item: { id: string }): Promise<Vehicle | undefined> {
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [
      item.id,
    ]);
    const vehicles = rows as Vehicle[];
    return vehicles.length > 0 ? vehicles[0] : undefined;
  }

  public async add(item: Vehicle): Promise<Vehicle | undefined> {
    const [result] = await pool.query(
      'INSERT INTO vehicles (maxCapacity) VALUES (?)',
      [item.maxCapacity ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Vehicle): Promise<Vehicle | undefined> {
    const [result] = await pool.query(
      'UPDATE vehicles SET maxCapacity = ? WHERE id = ?',
      [item.maxCapacity ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Vehicle | undefined> {
    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reset the counter so the next id stays sequential
    try {
      await pool.query('ALTER TABLE vehicles AUTO_INCREMENT = 1');
    } catch {
      // Ignored if the connection lacks ALTER permissions
    }
    return { id: item.id } as Vehicle;
  }
}