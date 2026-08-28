import { Repository } from '../shared/repository.js';
import { Vehicle } from './vehicle.entity.js';

export class VehicleService {
  constructor(private repository: Repository<Vehicle>) {}

  findAll(): Promise<Vehicle[] | undefined> {
    return this.repository.findAll();
  }

  findOne(item: { id: string }): Promise<Vehicle | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Vehicle): Promise<Vehicle | undefined> {
    return this.repository.add(item);
  }

  update(item: Vehicle): Promise<Vehicle | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Vehicle | undefined> {
    return this.repository.delete(item);
  }
}