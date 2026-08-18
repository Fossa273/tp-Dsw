import { Repository } from '../shared/repository.js';
import { Vehiculo } from './vehiculo.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class vehiculoRepository implements Repository<Vehiculo> {
  public async findAll(): Promise<Vehiculo[] | undefined> {
    const [vehiculos] = await pool.query('SELECT * from vehiculos');
    return vehiculos as Vehiculo[];
  }

  public async findOne(item: { id: string }): Promise<Vehiculo | undefined> {
    const resultado = await pool.query(
      'SELECT * from vehiculos WHERE id = ?',
      [item.id]
    );
    if (!resultado) {
      return undefined;
    }
    const vehiculo = (resultado[0] as Vehiculo[])[0];
    return vehiculo;
  }

  public async add(item: Vehiculo): Promise<Vehiculo | undefined> {
    const resultado = await pool.query(
      'INSERT INTO vehiculos (id, capacidadmax) VALUES (?, ?)',
      [item.id, item.capacidadmax]
    );
    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async update(item: Vehiculo): Promise<Vehiculo | undefined> {
    const resultado = await pool.query(
      'UPDATE vehiculos SET capacidadmax = ? WHERE id = ?',
      [item.capacidadmax, item.id]
    );

    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async delete(item: { id: string }): Promise<Vehiculo | undefined> {
    const resultado = await pool.query('DELETE FROM vehiculos WHERE id = ?', [
      item.id,
    ]);
    if (resultado) {
      return item as Vehiculo;
    }
    return undefined;
  }
}
