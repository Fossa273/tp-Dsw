import { Repository } from '../shared/repository.js';
import { Vehiculo } from './vehiculo.entity.js';

export class VehiculoService {
  constructor(private repository: Repository<Vehiculo>) {}

  findAll(): Promise<Vehiculo[] | undefined> {
    return this.repository.findAll();
  }

  findOne(item: { id: string }): Promise<Vehiculo | undefined> {
    return this.repository.findOne(item);
  }

  create(item: Vehiculo): Promise<Vehiculo | undefined> {
    return this.repository.add(item);
  }

  update(item: Vehiculo): Promise<Vehiculo | undefined> {
    return this.repository.update(item);
  }

  delete(item: { id: string }): Promise<Vehiculo | undefined> {
    return this.repository.delete(item);
  }
}
