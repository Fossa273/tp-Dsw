import { Repository } from '../shared/repository.js';
import { Locality } from './locality.entity.js';

export class LocalityService {
  constructor(private repository: Repository<Locality>) {}

  findAll(): Promise<Locality[] | undefined> {
    return this.repository.findAll();
  }
  findOne(item: { id: string }): Promise<Locality | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Locality): Promise<Locality | undefined> {
    return this.repository.add(item);
  }

  update(item: Locality): Promise<Locality | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Locality | undefined> {
    return this.repository.delete(item);
  }
}