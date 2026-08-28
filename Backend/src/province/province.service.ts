import { Repository } from '../shared/repository.js';
import { Province } from './province.entity.js';

export class ProvinceService {
  constructor(private repository: Repository<Province>) {}

  findAll(): Promise<Province[] | undefined> {
    return this.repository.findAll();
  }
  findOne(item: { id: string }): Promise<Province | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Province): Promise<Province | undefined> {
    return this.repository.add(item);
  }

  update(item: Province): Promise<Province | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Province | undefined> {
    return this.repository.delete(item);
  }
}