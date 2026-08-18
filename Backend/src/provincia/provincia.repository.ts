import { Repository } from '../shared/repository.js';
import { Provincia } from './provincia.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class provinciaRepository implements Repository<Provincia> {
  public async findAll(): Promise<Provincia[] | undefined> {
    const [provincias] = await pool.query('SELECT * from provincias');
    return provincias as Provincia[];
  }

  public async findOne(item: { id: string }): Promise<Provincia | undefined> {
    const resultado = await pool.query(
      'SELECT * from provincias WHERE id = ?',
      [item.id]
    );
    if (!resultado) {
      return undefined;
    }
    const localidad = (resultado[0] as Provincia[])[0];
    return localidad;
  }

  public async add(item: Provincia): Promise<Provincia | undefined> {
    const nuevaprovincia = await pool.query(
      'INSERT INTO provincias (id, nombre) VALUES (?, ?)',
      [item.id, item.nombreprov]
    );
    if (nuevaprovincia) {
      return item;
    }
    return undefined;
  }

  public async update(item: Provincia): Promise<Provincia | undefined> {
    const resultado = await pool.query(
      'UPDATE provincias SET nombre = ? WHERE id = ?',
      [item.nombreprov, item.id]
    );

    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async delete(item: { id: string }): Promise<Provincia | undefined> {
    const resultado = await pool.query('DELETE FROM provincias WHERE id = ?', [
      item.id,
    ]);
    if (resultado) {
      return item as Provincia;
    }
    return undefined;
  }
}
