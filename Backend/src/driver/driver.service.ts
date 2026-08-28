import { Repository } from '../shared/repository.js';
import { Driver } from './driver.entity.js';

export class DriverService {
  constructor(private repository: Repository<Driver>) {}

  findAll(): Promise<Driver[] | undefined> {
    return this.repository.findAll();
  }

  findOne(item: { id: string }): Promise<Driver | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Driver): Promise<Driver | undefined> {
    return this.repository.add(item);
  }

  update(item: Driver): Promise<Driver | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Driver | undefined> {
    return this.repository.delete(item);
  }
}
