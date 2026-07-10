import { clienteRepository } from './cliente.repository.js';
import { Cliente } from './cliente.entity.js';
const repository = new clienteRepository();
function sanitizeClienteInput(req, res, next) {
    req.body.sanitizeInput = {
        id: req.body.id,
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        telefono: req.body.telefono,
    };
    Object.keys(req.body.sanitizeInput).forEach((key) => {
        if (req.body.sanitizeInput[key] === undefined) {
            delete req.body.sanitizeInput[key];
        }
    });
    next();
}
function findAll(req, res) {
    res.json({ data: repository.findAll() });
}
function findOne(req, res) {
    const id = String(req.params.id);
    const cliente = repository.findOne({ id });
    if (cliente) {
        res.json(cliente);
    }
    else {
        res.status(404).json({ error: 'Cliente no encontrado' });
    }
}
function add(req, res) {
    const { id, nombre, apellido, email, telefono } = req.body.sanitizeInput;
    const nuevoCliente = new Cliente(id, nombre, apellido, email, telefono);
    const nuevocliente = repository.add(nuevoCliente);
    res.status(201).json(nuevocliente);
}
function update(req, res) {
    req.body.sanitizeInput.id = req.params.id;
    const clienteactualizado = repository.update(req.body.sanitizeInput);
    if (clienteactualizado) {
        res.status(200).json(clienteactualizado);
    }
    else {
        res.status(404).json({ error: 'Cliente no encontrado' });
    }
}
function remove(req, res) {
    const id = String(req.params.id);
    const deletedCliente = repository.delete({ id });
    if (deletedCliente) {
        res.json({ message: 'Cliente eliminado' });
    }
    else {
        res.status(404).json({ error: 'Cliente no encontrado' });
    }
}
export { sanitizeClienteInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=cliente.controler.js.map