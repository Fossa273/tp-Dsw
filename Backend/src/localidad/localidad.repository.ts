import { Repository } from '../shared/repository.js';
import { Localidad } from './localidad.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class localidadRepository implements Repository<Localidad> {
  public async findAll(): Promise<Localidad[] | undefined> {
    const [localidades] = await pool.query('SELECT * FROM localidades');
    return localidades as Localidad[];
  }

  public async findOne(item: { id: string }): Promise<Localidad | undefined> {
    const [rows] = await pool.query('SELECT * FROM localidades WHERE id = ?', [
      item.id,
    ]);
    const localidades = rows as Localidad[];
    return localidades.length > 0 ? localidades[0] : undefined;
  }

  // Busca una localidad por nombre (para validar duplicados)
  public async findByName(nombre: string): Promise<Localidad | undefined> {
    const [rows] = await pool.query(
      'SELECT * FROM localidades WHERE nombre = ?',
      [nombre]
    );
    const localidades = rows as Localidad[];
    return localidades.length > 0 ? localidades[0] : undefined;
  }

  public async add(item: Localidad): Promise<Localidad | undefined> {
    const [result] = await pool.query(
      'INSERT INTO localidades (nombre) VALUES (?)',
      [item.nombre ?? null]
    );
    const header = result as { insertId?: number };
    return { ...item, id: String(header.insertId) };
  }

  public async update(item: Localidad): Promise<Localidad | undefined> {
    const [result] = await pool.query(
      'UPDATE localidades SET nombre = ? WHERE id = ?',
      [item.nombre ?? null, item.id]
    );
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    return item;
  }

  public async delete(item: { id: string }): Promise<Localidad | undefined> {
    const [result] = await pool.query('DELETE FROM localidades WHERE id = ?', [
      item.id,
    ]);
    const header = result as { affectedRows: number };
    if (header.affectedRows === 0) {
      return undefined;
    }
    // Reinicia el contador para que el proximo id sea secuencial
    try {
      await pool.query('ALTER TABLE localidades AUTO_INCREMENT = 1');
    } catch {
      // Si la conexion no tiene permisos ALTER se ignora
    }
    return { id: item.id } as Localidad;
  }
}
