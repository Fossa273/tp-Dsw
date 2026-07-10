const Cliente = ({ id, nombre, edad, telefono, estado }) => {
  return (
    <div>
      <h1>Cliente</h1>
      <h2>Información del cliente: </h2>
      <h2>ID: {id}</h2>
      <h2>Nombre: {nombre}</h2>
      <h2>Edad: {edad}</h2>
      <h2> Teléfono: {telefono} </h2>
      <h2> Estado: {estado} </h2>
    </div>
  );
};

export default Cliente;
