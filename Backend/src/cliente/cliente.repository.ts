import { Repository } from '../shared/repository.js';
import { Cliente } from './cliente.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

export class clienteRepository implements Repository<Cliente> {
  public async findAll(): Promise<Cliente[] | undefined> {
    const [clientes] = await pool.query(
      'SELECT * from clientes WHERE activo = 1'
    );
    return clientes as Cliente[];
  }

  public async findOne(item: { id: string }): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'SELECT * from clientes WHERE id = ? AND activo = 1',
      [item.id]
    );
    if (!resultado) {
      return undefined;
    }
    const cliente = (resultado[0] as Cliente[])[0];
    return cliente;
  }

  public async add(item: Cliente): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'INSERT INTO clientes (id, nombre, apellido, email, telefono, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [item.id, item.nombre, item.apellido, item.email, item.telefono]
    );
    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async update(item: Cliente): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'UPDATE clientes SET nombre = ?, apellido = ?, email = ?, telefono = ? WHERE id = ? AND activo = 1',
      [item.nombre, item.apellido, item.email, item.telefono, item.id]
    );

    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async delete(item: { id: string }): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'UPDATE clientes SET activo = 0 WHERE id = ?',
      [item.id]
    );
    if (resultado) {
      return item as Cliente;
    }
    return undefined;
  }
}
