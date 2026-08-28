import { Repository } from '../shared/repository.js';
import { Client } from './client.entity.js';

export class ClientService {
  constructor(private repository: Repository<Client>) {}

  findAll(): Promise<Client[] | undefined> {
    return this.repository.findAll();
  }

  findOne(item: { id: string }): Promise<Client | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Client): Promise<Client | undefined> {
    return this.repository.add(item);
  }

  update(item: Client): Promise<Client | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Client | undefined> {
    return this.repository.delete(item);
  }
}