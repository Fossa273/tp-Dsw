import { Repository } from '../shared/repository.js';
import { Provincia } from './provincia.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class provinciaRepository implements Repository<Provincia> {
  public async findAll(): Promise<Provincia[] | undefined> {
    const [provincias] = await pool.query('SELECT * FROM provincias');
    return provincias as Provincia[];
  }

  public async findOne(item: { id: string }): Promise<Provincia | undefined> {
    const [rows] = await pool.query('SELECT * FROM provincias WHERE id = ?', [
      item.id,
    ]);
    const provincias = rows as Provincia[];
    return provincias.length > 0 ? provincias[0] : undefined;
  }

  // Busca una provincia por nombre (para validar duplicados)
  public async findByName(nombreprov: string): Promise<Provincia | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM provincias WHERE nombreprov = ?',
      [nombreprov]
    );
    const provincias = rows as Provincia[];
    return provincias.length > 0 ? provincias[0] : undefined;
  }

  public async add(item: Provincia): Promise<Provincia | undefined> {
    const [result] = await pool.query(
      'INSERT INTO provincias (nombreprov) VALUES (?)',
      [item.nombreprov ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Provincia): Promise<Provincia | undefined> {
    const [result] = await pool.query(
      'UPDATE provincias SET nombreprov = ? WHERE id = ?',
      [item.nombreprov ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Provincia | undefined> {
    const [result] = await pool.query('DELETE FROM provincias WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reinicia el contador para que el proximo id sea secuencial
    try {
      await pool.query('ALTER TABLE provincias AUTO_INCREMENT = 1');
    } catch {
      // Si la conexion no tiene permisos ALTER se ignora
    }
    return { id: item.id } as Provincia;
  }
}
