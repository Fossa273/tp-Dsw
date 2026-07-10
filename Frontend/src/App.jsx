import Cliente from './components/cliente';
import { useState } from 'react';
import './index.scss';

const DATA_INICIAL_CLIENTES = [
  {
    id: 1,
    nombre: 'John Doe',
    edad: 30,
    telefono: '555-1234',
    estado: 'Disponible',
  },
  {
    id: 2,
    nombre: 'Jane Smith',
    edad: 25,
    telefono: '555-5678',
    estado: 'No disponible',
  },
  {
    id: 3,
    nombre: 'Michael Johnson',
    edad: 35,
    telefono: '555-9012',
    estado: 'Disponible',
  },
];

const App = () => {
  // 1. Pasamos los clientes al estado para que React pueda controlar sus cambios
  const [clientes, setClientes] = useState(DATA_INICIAL_CLIENTES);

  // Alternativa A: Cambiar la disponibilidad de TODOS los clientes a la vez
  const toggleTodosLosEstados = () => {
    setClientes((prevClientes) =>
      prevClientes.map((cliente) => ({
        ...cliente,
        // Si quieres alternar el estado de cada uno de manera independiente:
        estado:
          cliente.estado === 'Disponible' ? 'No disponible' : 'Disponible',
      })),
    );
  };

  // Alternativa B: Si en el futuro quieres cambiar solo UN cliente por su ID (ej. el primero)
  const cambiarEstadoDeUnCliente = (id) => {
    setClientes((prevClientes) =>
      prevClientes.map((cliente) =>
        cliente.id === id
          ? {
              ...cliente,
              estado:
                cliente.estado === 'Disponible'
                  ? 'No disponible'
                  : 'Disponible',
            }
          : cliente,
      ),
    );
  };

  const [IdSeleccionado, setIdSeleccionado] = useState(null);

  return (
    <>
      <section id="center">
        <div>
          <h1>Cliente individual (El primero):</h1>
          {/* Renderizamos directamente desde el estado */}
          {clientes[0] && (
            <Cliente
              key={clientes[0].id}
              nombre={clientes[0].nombre}
              edad={clientes[0].edad}
              telefono={clientes[0].telefono}
              estado={clientes[0].estado}
            />
          )}

          <h1>O todos los clientes:</h1>
          {/* Mapeamos el array DENTRO del render para que reaccione al estado */}
          {clientes.map((cliente) => (
            <Cliente
              key={cliente.id}
              nombre={cliente.nombre}
              edad={cliente.edad}
              telefono={cliente.telefono}
              estado={cliente.estado}
            />
          ))}

          <br />
          <span>
            <button onClick={toggleTodosLosEstados}>
              Cambiar disponibilidad de todos
            </button>
          </span>
          <span>
            <br />
            <br />
            <input
              type="number"
              placeholder="ID del cliente"
              onChange={(e) => setIdSeleccionado(Number(e.target.value))}
            />
            <br />
            <br />
            <button onClick={() => cambiarEstadoDeUnCliente(IdSeleccionado)}>
              Cambiar disponibilidad del cliente con ID {IdSeleccionado}
            </button>
          </span>
        </div>
      </section>
    </>
  );
};

export default App;
