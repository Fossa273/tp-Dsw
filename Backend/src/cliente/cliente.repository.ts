import { Repository } from '../shared/repository.js';
import { Cliente } from './cliente.entity.js';

const clientes: Cliente[] = [
  new Cliente('1', 'Juan', 'Perez', 'juan@example.com', '1234567890'),
  new Cliente('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321'),
  new Cliente('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455'),
  new Cliente('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899'),
  new Cliente('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655'),
];

export class clienteRepository implements Repository<Cliente> {
  public findAll(): Cliente[] | undefined {
    return clientes;
  }

  public findOne(item: { id: string }): Cliente | undefined {
    return clientes.find((cliente) => cliente.id === item.id);
  }

  public add(item: Cliente): Cliente | undefined {
    clientes.push(item);
    return item;
  }

  public update(item: Cliente): Cliente | undefined {
    const index = clientes.findIndex((cliente) => cliente.id === item.id);
    if (index !== -1) {
      clientes[index] = { ...clientes[index], ...item };
      return clientes[index];
    }
    return undefined;
  }
  public delete(item: { id: string }): Cliente | undefined {
    const index = clientes.findIndex((cliente) => cliente.id === item.id);
    if (index !== -1) {
      return clientes.splice(index, 1)[0];
    }
    return undefined;
  }
}
