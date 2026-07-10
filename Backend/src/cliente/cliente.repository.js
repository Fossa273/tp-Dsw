import { Cliente } from './cliente.entity.js';
const clientes = [
    new Cliente('1', 'Juan', 'Perez', 'juan@example.com', '1234567890'),
    new Cliente('2', 'Juana', 'Gonzalez', 'maria@example.com', '0987654321'),
    new Cliente('3', 'Pedro', 'Rodriguez', 'pedro@example.com', '1122334455'),
    new Cliente('4', 'Ana', 'Lopez', 'ana@example.com', '5566778899'),
    new Cliente('5', 'Luis', 'Martinez', 'luis@example.com', '9988776655'),
];
export class clienteRepository {
    findAll() {
        return clientes;
    }
    findOne(item) {
        return clientes.find((cliente) => cliente.id === item.id);
    }
    add(item) {
        clientes.push(item);
        return item;
    }
    update(item) {
        const index = clientes.findIndex((cliente) => cliente.id === item.id);
        if (index !== -1) {
            clientes[index] = { ...clientes[index], ...item };
            return clientes[index];
        }
        return undefined;
    }
    delete(item) {
        const index = clientes.findIndex((cliente) => cliente.id === item.id);
        if (index !== -1) {
            return clientes.splice(index, 1)[0];
        }
        return undefined;
    }
}
//# sourceMappingURL=cliente.repository.js.map