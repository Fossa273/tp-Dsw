import { Repository } from '../shared/repository.js';
import { Localidad } from './localidad.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class localidadRepository implements Repository<Localidad> {
  public async findAll(): Promise<Localidad[] | undefined> {
    const [localidades] = await pool.query('SELECT * from localidades');
    return localidades as Localidad[];
  }

  public async findOne(item: { id: string }): Promise<Localidad | undefined> {
    const resultado = await pool.query(
      'SELECT * from localidades WHERE id = ?',
      [item.id]
    );
    if (!resultado) {
      return undefined;
    }
    const localidad = (resultado[0] as Localidad[])[0];
    return localidad;
  }

  public async add(item: Localidad): Promise<Localidad | undefined> {
    const resultado = await pool.query(
      'INSERT INTO localidades (id, nombre) VALUES (?, ?)',
      [item.id, item.nombreloc]
    );
    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async update(item: Localidad): Promise<Localidad | undefined> {
    const resultado = await pool.query(
      'UPDATE localidades SET nombre = ? WHERE id = ?',
      [item.nombreloc, item.id]
    );

    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async delete(item: { id: string }): Promise<Localidad | undefined> {
    const resultado = await pool.query('DELETE FROM localidades WHERE id = ?', [
      item.id,
    ]);
    if (resultado) {
      return item as Localidad;
    }
    return undefined;
  }
}
