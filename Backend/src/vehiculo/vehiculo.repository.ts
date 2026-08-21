import { Repository } from '../shared/repository.js';
import { Vehiculo } from './vehiculo.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class vehiculoRepository implements Repository<Vehiculo> {
  public async findAll(): Promise<Vehiculo[] | undefined> {
    const [vehiculos] = await pool.query('SELECT * FROM vehiculos');
    return vehiculos as Vehiculo[];
  }

  public async findOne(item: { id: string }): Promise<Vehiculo | undefined> {
    const [rows] = await pool.query('SELECT * FROM vehiculos WHERE id = ?', [
      item.id,
    ]);
    const vehiculos = rows as Vehiculo[];
    return vehiculos.length > 0 ? vehiculos[0] : undefined;
  }

  public async add(item: Vehiculo): Promise<Vehiculo | undefined> {
    const [result] = await pool.query(
      'INSERT INTO vehiculos (capacidadmax) VALUES (?)',
      [item.capacidadmax ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Vehiculo): Promise<Vehiculo | undefined> {
    const [result] = await pool.query(
      'UPDATE vehiculos SET capacidadmax = ? WHERE id = ?',
      [item.capacidadmax ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Vehiculo | undefined> {
    const [result] = await pool.query('DELETE FROM vehiculos WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reinicia el contador para que el proximo id sea secuencial
    try {
      await pool.query('ALTER TABLE vehiculos AUTO_INCREMENT = 1');
    } catch {
      // Si la conexion no tiene permisos ALTER se ignora
    }
    return { id: item.id } as Vehiculo;
  }
}
