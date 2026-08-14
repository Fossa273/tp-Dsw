import { Repository } from '../shared/repository.js';
import { Cliente } from './cliente.entity.js';
import { pool } from '../shared/db/conn.mysql.js';

const clientes: Cliente[] = [
  new Cliente('1', 'Juan', 'Perez', 'juan@example.com', '1234567890'),
  new Cliente('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321'),
  new Cliente('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455'),
  new Cliente('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899'),
  new Cliente('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655'),
];

export class clienteRepository implements Repository<Cliente> {
  public async findAll(): Promise<Cliente[] | undefined> {
    const [clientes] = await pool.query('SELECT * from clientes');
    return clientes as Cliente[];
  }

  public async findOne(item: { id: string }): Promise<Cliente | undefined> {
    const resultado = await pool.query('SELECT * from clientes WHERE id = ?', [
      item.id,
    ]);
    if (!resultado) {
      return undefined;
    }
    const cliente = (resultado[0] as Cliente[])[0];
    return cliente;
  }

  public async add(item: Cliente): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'INSERT INTO clientes (id, nombre, apellido, email, telefono) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.nombre, item.apellido, item.email, item.telefono]
    );
    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async update(item: Cliente): Promise<Cliente | undefined> {
    const resultado = await pool.query(
      'UPDATE clientes SET nombre = ?, apellido = ?, email = ?, telefono = ? WHERE id = ?',
      [item.nombre, item.apellido, item.email, item.telefono, item.id]
    );

    if (resultado) {
      return item;
    }
    return undefined;
  }

  public async delete(item: { id: string }): Promise<Cliente | undefined> {
    const resultado = await pool.query('DELETE FROM clientes WHERE id = ?', [
      item.id,
    ]);
    if (resultado) {
      return item as Cliente;
    }
    return undefined;
  }
}
