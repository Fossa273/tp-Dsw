import { Repository } from '../shared/repository.js';
import { Localidad } from './localidad.entity.js';

export class LocalidadService {
  constructor(private repository: Repository<Localidad>) {}

  findAll(): Promise<Localidad[] | undefined> {
    return this.repository.findAll();
  }
  findOne(item: { id: string }): Promise<Localidad | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Localidad): Promise<Localidad | undefined> {
    return this.repository.add(item);
  }

  update(item: Localidad): Promise<Localidad | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Localidad | undefined> {
    return this.repository.delete(item);
  }
}
