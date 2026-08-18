import { Repository } from '../shared/repository.js';
import { Provincia } from './provincia.entity.js';

export class ProvinciaService {
  constructor(private repository: Repository<Provincia>) {}

  findAll(): Promise<Provincia[] | undefined> {
    return this.repository.findAll();
  }
  findOne(item: { id: string }): Promise<Provincia | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Provincia): Promise<Provincia | undefined> {
    return this.repository.add(item);
  }

  update(item: Provincia): Promise<Provincia | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Provincia | undefined> {
    return this.repository.delete(item);
  }
}
