import { Repository } from '../shared/repository.js';
import { Cliente } from './cliente.entity.js';

export class clienteService {
  constructor(private repository: Repository<Cliente>) {}

  findAll(): Promise<Cliente[] | undefined> {
    return this.repository.findAll();
  }

  findOne(item: { id: string }): Promise<Cliente | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Cliente): Promise<Cliente | undefined> {
    return this.repository.add(item);
  }

  update(item: Cliente): Promise<Cliente | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Cliente | undefined> {
    return this.repository.delete(item);
  }
}
